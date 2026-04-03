// @ts-nocheck
'use client';

/**
 * Contacts Page — WeChat-style contact list
 * Reads from contactsStore.ts
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getSession } from '../../../../lib/localSession';
import { getContacts, searchContacts, addContact, type QuroContact } from '../../../../lib/contactsStore';

export default function MobileContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<QuroContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session) router.replace('/m/welcome');
    else loadContacts();
  }, [router]);

  async function loadContacts(query = '') {
    const results = await searchContacts(query);
    setContacts(results);
  }

  useEffect(() => {
    loadContacts(searchQuery);
  }, [searchQuery]);

  async function handleManualAdd() {
    const code = newCode.trim();
    if (code.length < 2) return;
    
    await addContact({
      quroCode: code,
      displayName: `User ${code}`,
      addedAt: new Date().toISOString()
    });
    
    setNewCode('');
    setShowAddModal(false);
    loadContacts(searchQuery);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F7F7F7', paddingBottom: 60 }}>
      {/* Header */}
      <header style={{ backgroundColor: '#F7F7F7', padding: '12px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>Contacts</h1>
        <button onClick={() => setShowAddModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </header>

      {/* Search */}
      <div style={{ padding: '8px 16px', backgroundColor: '#F7F7F7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#fff', borderRadius: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search contacts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, fontSize: 16, border: 'none', outline: 'none', background: 'transparent' }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#fff', marginTop: 8 }}>
        <div 
          onClick={() => router.push('/m/app/scan')}
          style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderBottom: '0.5px solid #F0F0F0', cursor: 'pointer' }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 500, color: '#111' }}>New Friends</span>
        </div>
      </div>

      {/* Contacts List */}
      <div style={{ marginTop: 8, flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '4px 16px', fontSize: 13, color: '#999', backgroundColor: '#F7F7F7' }}>All Contacts</div>
        
        {contacts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#999' }}>No contacts found</p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff' }}>
            {contacts.map((contact, i) => (
              <div
                key={contact.quroCode}
                onClick={() => router.push(`/m/app/chats/${contact.quroCode}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
                  borderBottom: i < contacts.length - 1 ? '0.5px solid #F0F0F0' : 'none',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {contact.avatarDataUrl ? (
                    <img src={contact.avatarDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 20, fontWeight: 600, color: '#9CA3AF' }}>{contact.displayName.charAt(0)}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 500, color: '#111', margin: 0 }}>{contact.displayName}</h3>
                  <p style={{ fontSize: 13, color: '#999', margin: '2px 0 0' }}>ID: {contact.quroCode}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 999, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 320, padding: 24 }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', textAlign: 'center' }}>Add Friend</h3>
              <input
                type="text"
                placeholder="Enter Quro ID"
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 16, outline: 'none', marginBottom: 20 }}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '12px', background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAdd}
                  style={{ flex: 1, padding: '12px', background: '#07C160', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
