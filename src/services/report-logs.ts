import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { ReportLog } from '@/types';

const REPORT_LOGS_COLLECTION = 'reportLogs';

export const addReportLog = async (userId: string, log: Omit<ReportLog, 'id' | 'userId' | 'generatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, REPORT_LOGS_COLLECTION), {
    ...log,
    userId,
    generatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const listenToUserReportLogs = (
  userId: string,
  callback: (logs: ReportLog[]) => void,
  onError?: (error: any) => void
) => {
  const q = query(
    collection(db, REPORT_LOGS_COLLECTION),
    where('userId', '==', userId),
    orderBy('generatedAt', 'desc')
  );

  return onSnapshot(q,
    (querySnapshot) => {
      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        generatedAt: doc.data().generatedAt?.toDate ? doc.data().generatedAt.toDate() : new Date(),
        dateRange: {
          from: doc.data().dateRange.from?.toDate ? doc.data().dateRange.from.toDate() : new Date(),
          to: doc.data().dateRange.to?.toDate ? doc.data().dateRange.to.toDate() : new Date(),
        },
      })) as ReportLog[];
      callback(logs);
    },
    (error) => {
      console.error('Error listening to report logs:', error);
      if (onError) onError(error);
    }
  );
};

