import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Bell, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MemberProfilePanel = ({ isOpen, setIsOpen }) => {
  const { user, profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateProfile({ full_name: fullName });
    if (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile updated successfully." });
    }
    setIsSaving(false);
    setIsOpen(false);
  };
  
  const handleFeatureClick = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex justify-end"
        onClick={() => setIsOpen(false)}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-md h-full bg-slate-50 shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Member Settings</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-grow p-6 overflow-y-auto">
            <Tabs defaultValue="profile">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="notifications">Alerts</TabsTrigger>
              </TabsList>
              <TabsContent value="profile" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ''} disabled className="mt-1 bg-slate-100 cursor-not-allowed" />
                  </div>
                  <Button onClick={handleSave} disabled={isSaving} className="w-full">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="billing" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-white">
                    <p className="font-semibold">Current Plan: Mentee Elite</p>
                    <p className="text-sm text-slate-600">Renews on: October 28, 2025</p>
                  </div>
                  <Button onClick={handleFeatureClick} className="w-full" variant="outline">Manage Subscription</Button>
                  <Button onClick={handleFeatureClick} className="w-full" variant="outline">View Payment History</Button>
                </div>
              </TabsContent>
              <TabsContent value="notifications" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
                    <Label htmlFor="new-deal-alerts" className="font-medium">New Deal Alerts</Label>
                    <Switch id="new-deal-alerts" defaultChecked onCheckedChange={handleFeatureClick} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
                    <Label htmlFor="webinar-reminders" className="font-medium">Webinar Reminders</Label>
                    <Switch id="webinar-reminders" defaultChecked onCheckedChange={handleFeatureClick} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
                    <Label htmlFor="weekly-summary" className="font-medium">Weekly Summary Email</Label>
                    <Switch id="weekly-summary" onCheckedChange={handleFeatureClick} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MemberProfilePanel;