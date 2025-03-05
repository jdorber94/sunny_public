import { useState, useEffect, useRef } from 'react';
import { onSnapshot, DocumentReference, CollectionReference, Query, DocumentData, DocumentSnapshot, QuerySnapshot, Unsubscribe } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

type SubscriptionTarget = DocumentReference | CollectionReference | Query;

interface SubscriptionOptions {
  onError?: (error: Error) => void;
  errorMessage?: string;
}

export function useFirebaseSubscription<T>(
  target: SubscriptionTarget | null,
  options: SubscriptionOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!target) {
      setLoading(false);
      setData(null);
      return;
    }

    let unsubscribe: Unsubscribe;

    try {
      if (target instanceof DocumentReference) {
        unsubscribe = onSnapshot(
          target,
          (snapshot: DocumentSnapshot<DocumentData>) => {
            if (!isMountedRef.current) return;
            
            const item = snapshot.exists() 
              ? { id: snapshot.id, ...snapshot.data() } as T
              : null;
            setData(item);
            setLoading(false);
          },
          (error: Error) => {
            if (!isMountedRef.current) return;
            
            console.error('Firebase subscription error:', error);
            setError(error);
            setLoading(false);
            
            if (options.onError) {
              options.onError(error);
            } else {
              toast.error(options.errorMessage || 'Failed to load data');
            }
          }
        );
      } else {
        unsubscribe = onSnapshot(
          target as Query<DocumentData>,
          (snapshot: QuerySnapshot<DocumentData>) => {
            if (!isMountedRef.current) return;
            
            const items = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as T;
            setData(items);
            setLoading(false);
          },
          (error: Error) => {
            if (!isMountedRef.current) return;
            
            console.error('Firebase subscription error:', error);
            setError(error);
            setLoading(false);
            
            if (options.onError) {
              options.onError(error);
            } else {
              toast.error(options.errorMessage || 'Failed to load data');
            }
          }
        );
      }

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('Firebase subscription setup error:', err);
      setError(err as Error);
      setLoading(false);
      
      if (options.onError) {
        options.onError(err as Error);
      } else {
        toast.error(options.errorMessage || 'Failed to set up data subscription');
      }
    }

    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [target, options.onError, options.errorMessage]);

  return { data, loading, error };
} 