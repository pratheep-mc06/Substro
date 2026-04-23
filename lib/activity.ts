import { createClient } from '@/utils/supabase/client';

export type ActivityAction = 'upload' | 'cancelled' | 'dismissed' | 'confirmed' | 'goal_set';

export async function logActivity(action: ActivityAction, metadata: any = {}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from('activity_log')
    .insert({
      user_id: user.id,
      action,
      metadata
    });

  if (error) {
    console.error('Failed to log activity:', error.message);
  }
}
