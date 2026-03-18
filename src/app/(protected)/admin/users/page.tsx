import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Users } from 'lucide-react';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from('cb_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold">Users</h1>

      {!profiles || profiles.length === 0 ? (
        <div className="text-center py-16"><Users className="h-8 w-8 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No users yet</p></div>
      ) : (
        <div className="space-y-3">
          {profiles.map(profile => (
            <Card key={profile.id}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{profile.full_name || 'No name'}</p>
                    <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>{profile.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  <p className="text-xs text-muted-foreground">Joined {formatDate(profile.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-heading font-bold">{profile.generation_credits}</p>
                  <p className="text-xs text-muted-foreground">credits</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
