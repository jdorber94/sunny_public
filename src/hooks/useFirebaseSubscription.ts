import { useState, useEffect } from 'react';
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

interface SubscriptionOptions {
  onError?: (error: Error) => void;
  errorMessage?: string;
}

type CollectionType<T> = T extends any[] ? T[number] : T;

export function useFirebaseSubscription<T>(
  ref: CollectionReference<CollectionType<T>> | DocumentReference<CollectionType<T>> | Query<CollectionType<T>> | null,
  options: SubscriptionOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    console.log('Setting up subscription for:', ref);
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
      console.log('Cleaning up subscription');
      unsubscribe();
    };
  }, [ref]);

  return { data, loading, error };
} 