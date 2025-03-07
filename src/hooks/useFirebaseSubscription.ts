import { useState, useEffect, useRef } from 'react';
import { 
  CollectionReference, 
  DocumentReference, 
  Query, 
  onSnapshot, 
  DocumentData, 
  QuerySnapshot, 
  DocumentSnapshot 
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { AppError, handleError, logError } from '@/utils/errorHandling';
import { SubscriptionOptions } from '@/types';

// Type for any Firestore reference that can be subscribed to
export type FirestoreReference<T> = 
  | CollectionReference<T> 
  | DocumentReference<T> 
  | Query<T>;

// Type guard to check if a reference is a DocumentReference
function isDocumentReference<T>(
  ref: FirestoreReference<T> | null
): ref is DocumentReference<T> {
  return ref !== null && 'path' in ref && !('where' in ref) && !('orderBy' in ref);
}

/**
 * A hook to subscribe to Firestore data with improved type safety and error handling
 * 
 * @param reference - The Firestore reference to subscribe to (collection, document, or query)
 * @param options - Optional configuration for the subscription
 * @returns An object containing the data, loading state, and error
 */
export function useFirebaseSubscription<T>(
  reference: FirestoreReference<T> | null,
  options: SubscriptionOptions = {}
) {
  const { 
    onError, 
    onData, 
    errorMessage = 'Error subscribing to data',
    showErrorToast = true
  } = options;
  
  const [data, setData] = useState<T | T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<AppError | null>(null);
  
  // Use a ref to track the latest callback functions to avoid dependency issues
  const callbacksRef = useRef({ onData, onError });
  
  // Update the ref when callbacks change
  useEffect(() => {
    callbacksRef.current = { onData, onError };
  }, [onData, onError]);
  
  useEffect(() => {
    // Reset state when reference changes
    setLoading(true);
    setError(null);
    
    // No subscription if reference is null
    if (!reference) {
      setLoading(false);
      setData(null);
      return;
    }
    
    let unsubscribe: () => void;
    
    try {
      // Create the subscription
      if (isDocumentReference(reference)) {
        unsubscribe = onSnapshot(
          reference,
          {
            next: (snapshot: DocumentSnapshot<T>) => {
              try {
                // Get the data, which will be null if the document doesn't exist
                let docData: T | null = null;
                
                try {
                  // Safely get data
                  docData = snapshot.data() || null;
                } catch (dataErr) {
                  console.warn('Error getting document data:', dataErr);
                }
                
                setData(docData);
                setLoading(false);
                
                // Call the onData callback if provided
                if (callbacksRef.current.onData) {
                  callbacksRef.current.onData(docData);
                }
              } catch (err: unknown) {
                const appError = handleError(err, 'Error processing snapshot data');
                setError(appError);
                setLoading(false);
                
                // Log the error with more context
                console.error('Snapshot processing error:', {
                  docId: snapshot.id,
                  error: err
                });
                logError(appError);
                
                // Call the onError callback if provided
                if (callbacksRef.current.onError) {
                  callbacksRef.current.onError(appError);
                }
              }
            },
            error: (err: unknown) => {
              const appError = handleError(err, errorMessage);
              setError(appError);
              setLoading(false);
              
              // Log the error
              logError(appError);
              
              // Show toast if enabled
              if (showErrorToast) {
                toast.error(appError.message);
              }
              
              // Call the onError callback if provided
              if (callbacksRef.current.onError) {
                callbacksRef.current.onError(appError);
              }
            }
          }
        );
      } else {
        unsubscribe = onSnapshot(
          reference as Query<T>,
          {
            next: (snapshot: QuerySnapshot<T>) => {
              try {
                const docsData = snapshot.docs.map(doc => {
                  try {
                    return doc.data();
                  } catch (docErr) {
                    console.error(`Error processing doc ${doc.id}:`, docErr);
                    return null;
                  }
                }).filter(Boolean) as T[]; // Filter out null values
                
                setData(docsData);
                setLoading(false);
                
                // Call the onData callback if provided
                if (callbacksRef.current.onData) {
                  callbacksRef.current.onData(docsData);
                }
              } catch (err: unknown) {
                const appError = handleError(err, 'Error processing snapshot data');
                setError(appError);
                setLoading(false);
                
                // Log more context about the error
                console.error('Collection snapshot processing error:', {
                  docsCount: snapshot.docs.length,
                  error: err
                });
                logError(appError);
                
                // Call the onError callback if provided
                if (callbacksRef.current.onError) {
                  callbacksRef.current.onError(appError);
                }
              }
            },
            error: (err: unknown) => {
              const appError = handleError(err, errorMessage);
              setError(appError);
              setLoading(false);
              
              // Log the error
              logError(appError);
              
              // Show toast if enabled
              if (showErrorToast) {
                toast.error(appError.message);
              }
              
              // Call the onError callback if provided
              if (callbacksRef.current.onError) {
                callbacksRef.current.onError(appError);
              }
            }
          }
        );
      }
    } catch (err) {
      console.error('Error setting up subscription:', err);
      setError(handleError(err, 'Error setting up subscription'));
      setLoading(false);
      
      // Return a no-op cleanup function
      return () => {};
    }
    
    // Clean up the subscription when the component unmounts or the reference changes
    return () => {
      try {
        unsubscribe();
      } catch (err) {
        console.error('Error unsubscribing:', err);
      }
    };
  }, [reference, errorMessage, showErrorToast]);
  
  return { data, loading, error };
} 