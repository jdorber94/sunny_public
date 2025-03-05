import { useState, useEffect, useRef } from 'react';
import { 
  CollectionReference, 
  DocumentReference, 
  Query, 
  onSnapshot, 
  DocumentData, 
  QuerySnapshot, 
  DocumentSnapshot,
  FirestoreDataConverter
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface SubscriptionOptions {
  onError?: (error: Error) => void;
  errorMessage?: string;
}

type CollectionType<T> = T extends any[] ? T[number] : T;

// Helper function to get a string identifier for a Firestore reference
function getRefId(ref: CollectionReference<any> | DocumentReference<any> | Query<any> | null): string | null {
  if (!ref) return null;
  
  if ('path' in ref) {
    return ref.path;
  }
  
  // For Query objects that don't have a direct path
  return JSON.stringify(ref);
}

export function useFirebaseSubscription<T>(
  ref: CollectionReference<CollectionType<T>> | DocumentReference<CollectionType<T>> | Query<CollectionType<T>> | null,
  options: SubscriptionOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use a ref to track the reference identifier to prevent unnecessary re-subscriptions
  const refIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Get a string representation of the reference
    const currentRefId = getRefId(ref);
    
    // Skip if the reference hasn't changed
    if (currentRefId === refIdRef.current) {
      return;
    }
    
    // Update the ref id
    refIdRef.current = currentRefId;
    
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    console.log('Setting up subscription for:', currentRefId);
    setLoading(true);

    let unsubscribe: () => void;

    if (ref.type === 'document') {
      // Document reference
      unsubscribe = onSnapshot(
        ref as DocumentReference<CollectionType<T>>,
        (snapshot: DocumentSnapshot<CollectionType<T>>) => {
          const item = snapshot.exists() ? {
            id: snapshot.id,
            ...snapshot.data()
          } as T : null;
          console.log('Document data updated:', item);
          setData(item);
          setLoading(false);
        },
        (error: Error) => {
          console.error('Subscription error:', error);
          setError(error);
          options.onError?.(error);
          setLoading(false);
          if (options.errorMessage) {
            toast.error(options.errorMessage);
          }
        }
      );
    } else {
      // Collection/Query reference
      unsubscribe = onSnapshot(
        ref as CollectionReference<CollectionType<T>> | Query<CollectionType<T>>,
        (snapshot: QuerySnapshot<CollectionType<T>>) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as unknown as T;
          console.log('Collection/Query data updated:', items);
          setData(items);
          setLoading(false);
        },
        (error: Error) => {
          console.error('Subscription error:', error);
          setError(error);
          options.onError?.(error);
          setLoading(false);
          if (options.errorMessage) {
            toast.error(options.errorMessage);
          }
        }
      );
    }

    return () => {
      console.log('Cleaning up subscription for:', currentRefId);
      unsubscribe();
    };
  }, [ref, options.onError, options.errorMessage]);

  return { data, loading, error };
} 