'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HabitSet, 
  getHabitSets, 
  createHabitSet, 
  updateHabitSet, 
  deleteHabitSet, 
  setActiveHabitSet,
  canCreateHabitSet,
  subscribeToHabitSets
} from '@/lib/firestoreService';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  SparklesIcon, 
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface HabitSetManagerProps {
  habitSets: HabitSet[];
  activeSetId: string | null;
  onSwitchSet: (setId: string, setName: string) => Promise<void>;
  onCreateSet: (name: string, description: string) => Promise<void>;
  onEditSet: (setId: string, name: string, description: string) => Promise<void>;
  onDeleteSet: (setId: string) => Promise<void>;
  isPremium: boolean;
}

export default function HabitSetManager({
  habitSets,
  activeSetId,
  onSwitchSet,
  onCreateSet,
  onEditSet,
  onDeleteSet,
  isPremium
}: HabitSetManagerProps) {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [editSetId, setEditSetId] = useState('');
  const [editSetName, setEditSetName] = useState('');
  const [editSetDescription, setEditSetDescription] = useState('');
  const [deleteSetId, setDeleteSetId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetName.trim()) {
      toast.error('Please enter a set name');
      return;
    }

    setLoading(true);
    try {
      await onCreateSet(newSetName.trim(), newSetDescription.trim());
      setShowCreateModal(false);
      setNewSetName('');
      setNewSetDescription('');
      toast.success('Habit set created');
    } catch (error) {
      toast.error('Failed to create habit set');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSetName.trim()) {
      toast.error('Please enter a set name');
      return;
    }

    setLoading(true);
    try {
      await onEditSet(editSetId, editSetName.trim(), editSetDescription.trim());
      setShowEditModal(false);
      setEditSetId('');
      setEditSetName('');
      setEditSetDescription('');
      toast.success('Habit set updated');
    } catch (error) {
      toast.error('Failed to update habit set');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSet = async () => {
    setLoading(true);
    try {
      await onDeleteSet(deleteSetId);
      setShowDeleteModal(false);
      setDeleteSetId('');
      toast.success('Habit set deleted');
    } catch (error) {
      toast.error('Failed to delete habit set');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (set: HabitSet) => {
    setEditSetId(set.id);
    setEditSetName(set.name);
    setEditSetDescription(set.description || '');
    setShowEditModal(true);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Habit Sets
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!isPremium && habitSets.length >= 1}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          New Set
        </button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {habitSets.map(set => (
          <div
            key={set.id}
            className={`p-4 rounded-lg border transition-all ${
              set.id === activeSetId
                ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:border-black dark:hover:border-white'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-medium">{set.name}</h3>
                {set.description && (
                  <p className="text-sm opacity-70">{set.description}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(set)}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
                {habitSets.length > 1 && (
                  <button
                    onClick={() => {
                      setDeleteSetId(set.id);
                      setShowDeleteModal(true);
                    }}
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {set.id !== activeSetId && (
              <button
                onClick={() => onSwitchSet(set.id, set.name)}
                className="mt-2 w-full px-3 py-1.5 text-sm border border-current rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Switch to this set
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
              Create New Habit Set
            </h3>
            <form onSubmit={handleCreateSet}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Enter set name"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newSetDescription}
                  onChange={(e) => setNewSetDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Enter set description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Set'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
              Edit Habit Set
            </h3>
            <form onSubmit={handleEditSet}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editSetName}
                  onChange={(e) => setEditSetName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Enter set name"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={editSetDescription}
                  onChange={(e) => setEditSetDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Enter set description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
              Delete Habit Set
            </h3>
            <p className="mb-6 text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this habit set? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSet}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Set'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 