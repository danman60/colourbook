'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Upload, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import { createClient } from '@/lib/supabase/client';
import { getFamilyMembers, createFamilyMember, deleteFamilyMember } from '@/lib/actions/family-members';
import type { FamilyMember } from '@/types';
import { toast } from 'sonner';

const RELATIONSHIPS = ['Mom', 'Dad', 'Daughter', 'Son', 'Sister', 'Brother', 'Grandma', 'Grandpa', 'Aunt', 'Uncle', 'Cousin', 'Pet', 'Friend'];

export default function FamilyPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    const { data } = await getFamilyMembers();
    if (data) setMembers(data);
    setLoading(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!photoFile || !name || !relationship) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const ext = photoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('family-photos')
        .upload(fileName, photoFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('family-photos').getPublicUrl(fileName);

      const { error } = await createFamilyMember({
        name,
        relationship,
        original_photo_url: urlData.publicUrl,
      });

      if (error) throw new Error(error);

      toast.success(`${name} added to your family!`);
      setDialogOpen(false);
      setName('');
      setRelationship('');
      setPhotoFile(null);
      loadMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from your family?`)) return;
    const { error } = await deleteFamilyMember(id);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`${memberName} removed`);
      loadMembers();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Family Members</h1>
          <p className="text-muted-foreground mt-1">Upload photos of your family to use in coloring pages</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer gap-2">
              <Plus className="h-4 w-4" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Add Family Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="photo">Photo</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors">
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={e => setPhotoFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="photo" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {photoFile ? photoFile.name : 'Click to upload a photo'}
                    </p>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah" required />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Select value={relationship} onValueChange={setRelationship} required>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map(r => (
                      <SelectItem key={r} value={r.toLowerCase()} className="cursor-pointer">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full cursor-pointer" disabled={uploading || !photoFile}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Family Member
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No family members yet"
          description="Upload photos of your family members to start creating personalized coloring pages!"
          actionLabel="Add First Member"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {members.map(member => (
            <Card key={member.id} className="overflow-hidden group">
              <div className="relative">
                <img
                  src={member.original_photo_url}
                  alt={member.name}
                  className="w-full aspect-square object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer h-8 w-8"
                  onClick={() => handleDelete(member.id, member.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-4">
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{member.relationship}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
