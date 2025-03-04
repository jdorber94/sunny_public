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
  const [editSetId, setEditSetId] = useState('');
  const [deleteSetId, setDeleteSetId] = useState('');
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');

  const openEditModal = (set: HabitSet) => {
    setEditSetId(set.id);
    setNewSetName(set.name);
    setNewSetDescription(set.description || '');
    setShowEditModal(true);
  };

  return (
    <div className="mb-8 bg-slate-900 dark:bg-slate-800 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Habit Sets</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>New Set</span>
        </button>
      </div>

      <div className="space-y-2">
        {habitSets.map(set => (
          <div
            key={set.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer
              ${activeSetId === set.id
                ? 'bg-slate-700 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            onClick={() => onSwitchSet(set.id, set.name)}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${activeSetId === set.id ? 'bg-green-400' : 'bg-slate-500'}`} />
              <span className="font-medium">{set.name}</span>
              {set.isPremium && (
                <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 rounded-full">
                  PRO
                </span>
              )}
            </div>

            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(set);
                }}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-600"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteSetId(set.id);
                    setShowDeleteModal(true);
                  }}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-600"
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
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Create New Habit Set
            </h3>
            <input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="Set Name"
              className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white mb-4"
            />
            <textarea
              value={newSetDescription}
              onChange={(e) => setNewSetDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white mb-4 resize-none"
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewSetName('');
                  setNewSetDescription('');
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newSetName.trim()) {
                    onCreateSet(newSetName.trim(), newSetDescription.trim());
                    setShowCreateModal(false);
                    setNewSetName('');
                    setNewSetDescription('');
                  }
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                disabled={!newSetName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Edit Habit Set
            </h3>
            <input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="Set Name"
              className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white mb-4"
            />
            <textarea
              value={newSetDescription}
              onChange={(e) => setNewSetDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white mb-4 resize-none"
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditSetId('');
                  setNewSetName('');
                  setNewSetDescription('');
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newSetName.trim()) {
                    onEditSet(editSetId, newSetName.trim(), newSetDescription.trim());
                    setShowEditModal(false);
                    setEditSetId('');
                    setNewSetName('');
                    setNewSetDescription('');
                  }
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                disabled={!newSetName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Delete Habit Set
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete this habit set? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteSetId('');
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteSet(deleteSetId);
                  setShowDeleteModal(false);
                  setDeleteSetId('');
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 