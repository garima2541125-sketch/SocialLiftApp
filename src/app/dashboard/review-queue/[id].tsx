import { useLocalSearchParams } from 'expo-router';
import ReviewQueueDetailScreen from '../../../../screens/dashboard/ReviewQueueDetailScreen';

export default function ReviewQueueDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ReviewQueueDetailScreen
      postId={id}
    />
  );
}