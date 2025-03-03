import { useEffect, useRef, useState } from 'react';
import { 
  Query, 
  DocumentReference, 
  onSnapshot, 
  Unsubscribe,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

type SubscriptionTarget = Query<DocumentData> | DocumentReference<DocumentData>;

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

  useEffect(() => {
    if (!target) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let unsubscribe: Unsubscribe;

      if ('type' in target && target.type === 'document') {
        // Handle document reference
        unsubscribe = onSnapshot(
          target as DocumentReference<DocumentData>,
          (snapshot: DocumentSnapshot<DocumentData>) => {
            const item = snapshot.exists() 
              ? { id: snapshot.id, ...snapshot.data() } as T
              : null;
            setData(item);
            setLoading(false);
          },
          (error: Error) => {
            console.error('Firebase subscription error:', error);
            setError(error);
            setLoading(false);
            
            if (options.onError) {
              options.onError(error);
            } else {
              toast.error(
                options.errorMessage || 'Failed to load data. Please try again.'
              );
            }
          }
        );
      } else {
        // Handle collection query
        unsubscribe = onSnapshot(
          target as Query<DocumentData>,
          (snapshot: QuerySnapshot<DocumentData>) => {
            const items = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as T;
            setData(items);
            setLoading(false);
          },
          (error: Error) => {
            console.error('Firebase subscription error:', error);
            setError(error);
            setLoading(false);
            
            if (options.onError) {
              options.onError(error);
            } else {
              toast.error(
                options.errorMessage || 'Failed to load data. Please try again.'
              );
            }
          }
        );
      }

      unsubscribeRef.current = unsubscribe;
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (err) {
      console.error('Firebase subscription setup error:', err);
      setError(err as Error);
      setLoading(false);
      
      if (options.onError) {
        options.onError(err as Error);
      } else {
        toast.error(
          options.errorMessage || 'Failed to set up data subscription. Please try again.'
        );
      }
    }
  }, [target, options.onError, options.errorMessage]);

  return { data, loading, error };
} 