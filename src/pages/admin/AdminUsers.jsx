import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import AdminLayout from '@/pages/admin/AdminLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, role');

    if (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Could not fetch user profiles.",
        variant: "destructive",
      });
    } else {
      const combinedUsers = (profiles || []).map(profile => ({
        id: profile.id,
        email: 'Hidden for security',
        full_name: profile.full_name || 'N/A',
        role: profile.role || 'user',
      }));
      setUsers(combinedUsers);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const handleAction = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
    });
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Manage Users - Admin</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Manage Users</h1>
        
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-800">Name</th>
                  <th className="p-4 font-semibold text-slate-800">Email</th>
                  <th className="p-4 font-semibold text-slate-800">Role</th>
                  <th className="p-4 font-semibold text-slate-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center p-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        <span className="ml-4 text-slate-600">Loading Users...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="4" className="text-center p-8 text-slate-500">No users found.</td></tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900">{user.full_name}</td>
                      <td className="p-4 text-slate-600">{user.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={handleAction}><Edit className="w-4 h-4" /></Button>
                        <Button variant="destructive" size="sm" onClick={handleAction}><Trash className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminUsers;