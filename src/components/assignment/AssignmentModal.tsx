/**
 * AssignmentModal - Universal Assignment Component
 * Version: 1.1 - WITH REMOVE FUNCTIONALITY
 * 
 * Allows assigning/removing any entity to:
 * - Frequencies
 * - Sequences
 * - Persons
 * - Conditions
 */

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getFrequencies,
  getSequences,
  getPersons,
  getConditions,
  assignFrequencyToPerson,
  assignSequenceToPerson,
  assignFrequencyToCondition,
  assignSequenceToCondition,
  removeFrequencyFromPerson,
  removeSequenceFromPerson,
  removeFrequencyFromCondition,
  removeSequenceFromCondition,
  getFrequenciesForPerson,
  getSequencesForPerson,
  getFrequenciesForCondition,
  getSequencesForCondition,
  type Frequency,
  type Sequence,
  type Person,
  type Condition,
} from '@/lib/db';
import { toast } from 'sonner';

type EntityType = 'frequency' | 'sequence' | 'person' | 'condition';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityId: number;
  entityName: string;
  onQuickCreate?: (type: EntityType) => void;
}

export function AssignmentModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  onQuickCreate,
}: AssignmentModalProps) {
  const { t } = useTranslation();
  
  // Available items to assign to
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  
  // Currently assigned items
  const [assignedFrequencies, setAssignedFrequencies] = useState<number[]>([]);
  const [assignedSequences, setAssignedSequences] = useState<number[]>([]);
  const [assignedPersons, setAssignedPersons] = useState<number[]>([]);
  const [assignedConditions, setAssignedConditions] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, entityType, entityId]);

  const loadData = async () => {
    // Load all available items
    const [freqs, seqs, pers, conds] = await Promise.all([
      getFrequencies(),
      getSequences(),
      getPersons(),
      getConditions(),
    ]);
    
    setFrequencies(freqs);
    setSequences(seqs);
    setPersons(pers);
    setConditions(conds);

    // Load currently assigned items based on entity type
    if (entityType === 'person') {
      const [assignedFreqs, assignedSeqs] = await Promise.all([
        getFrequenciesForPerson(entityId),
        getSequencesForPerson(entityId),
      ]);
      setAssignedFrequencies(assignedFreqs.map(f => f.id!));
      setAssignedSequences(assignedSeqs.map(s => s.id!));
    } else if (entityType === 'condition') {
      const [assignedFreqs, assignedSeqs] = await Promise.all([
        getFrequenciesForCondition(entityId),
        getSequencesForCondition(entityId),
      ]);
      setAssignedFrequencies(assignedFreqs.map(f => f.id!));
      setAssignedSequences(assignedSeqs.map(s => s.id!));
    }
  };

  const handleToggle = async (targetType: EntityType, targetId: number) => {
    try {
      let isAssigned = false;
      let assignFunc: any;
      let removeFunc: any;

      // Determine assignment state and functions based on entity types
      if (entityType === 'person') {
        if (targetType === 'frequency') {
          isAssigned = assignedFrequencies.includes(targetId);
          assignFunc = () => assignFrequencyToPerson(entityId, targetId);
          removeFunc = () => removeFrequencyFromPerson(entityId, targetId);
        } else if (targetType === 'sequence') {
          isAssigned = assignedSequences.includes(targetId);
          assignFunc = () => assignSequenceToPerson(entityId, targetId);
          removeFunc = () => removeSequenceFromPerson(entityId, targetId);
        }
      } else if (entityType === 'condition') {
        if (targetType === 'frequency') {
          isAssigned = assignedFrequencies.includes(targetId);
          assignFunc = () => assignFrequencyToCondition(entityId, targetId);
          removeFunc = () => removeFrequencyFromCondition(entityId, targetId);
        } else if (targetType === 'sequence') {
          isAssigned = assignedSequences.includes(targetId);
          assignFunc = () => assignSequenceToCondition(entityId, targetId);
          removeFunc = () => removeSequenceFromCondition(entityId, targetId);
        }
      }

      // Execute assign or remove
      if (isAssigned && removeFunc) {
        await removeFunc();
        
        // Update local state
        if (targetType === 'frequency') {
          setAssignedFrequencies(prev => prev.filter(id => id !== targetId));
        } else if (targetType === 'sequence') {
          setAssignedSequences(prev => prev.filter(id => id !== targetId));
        }
        
        toast.success('Zuordnung entfernt');
      } else if (!isAssigned && assignFunc) {
        await assignFunc();
        
        // Update local state
        if (targetType === 'frequency') {
          setAssignedFrequencies(prev => [...prev, targetId]);
        } else if (targetType === 'sequence') {
          setAssignedSequences(prev => [...prev, targetId]);
        }
        
        toast.success('Zugeordnet');
      }
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
      console.error(error);
    }
  };

  if (!isOpen) return null;

  // Determine what can be assigned based on entity type
  const canAssignFrequencies = entityType === 'person' || entityType === 'condition' || entityType === 'sequence';
  const canAssignSequences = entityType === 'person' || entityType === 'condition' || entityType === 'frequency';
  const canAssignPersons = entityType === 'frequency' || entityType === 'sequence' || entityType === 'condition';
  const canAssignConditions = entityType === 'frequency' || entityType === 'sequence' || entityType === 'person';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-heading font-bold text-white">
              Zuordnen
            </h2>
            <p className="text-muted-foreground mt-1">
              {entityName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Frequencies */}
          {canAssignFrequencies && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">🎵 Frequenzen</h3>
                {onQuickCreate && (
                  <button
                    onClick={() => onQuickCreate('frequency')}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Neue Frequenz
                  </button>
                )}
              </div>
              <div className="grid gap-2">
                {frequencies.map(freq => (
                  <label
                    key={freq.id}
                    className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={assignedFrequencies.includes(freq.id!)}
                      onChange={() => handleToggle('frequency', freq.id!)}
                      className="w-5 h-5"
                    />
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: freq.color }}
                    />
                    <div className="flex-1">
                      <span className="text-white font-medium">{freq.name}</span>
                      <span className="text-primary font-mono text-sm ml-2">{freq.hz} Hz</span>
                    </div>
                  </label>
                ))}
                {frequencies.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Keine Frequenzen verfügbar
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Sequences */}
          {canAssignSequences && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">📋 Sequenzen</h3>
                {onQuickCreate && (
                  <button
                    onClick={() => onQuickCreate('sequence')}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Neue Sequenz
                  </button>
                )}
              </div>
              <div className="grid gap-2">
                {sequences.map(seq => (
                  <label
                    key={seq.id}
                    className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={assignedSequences.includes(seq.id!)}
                      onChange={() => handleToggle('sequence', seq.id!)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <span className="text-white font-medium">{seq.name}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        {seq.frequencies?.length || 0} Frequenzen
                      </span>
                    </div>
                  </label>
                ))}
                {sequences.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Keine Sequenzen verfügbar
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Persons */}
          {canAssignPersons && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">👤 Personen</h3>
                {onQuickCreate && (
                  <button
                    onClick={() => onQuickCreate('person')}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Neue Person
                  </button>
                )}
              </div>
              <div className="grid gap-2">
                {persons.map(person => (
                  <label
                    key={person.id}
                    className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={assignedPersons.includes(person.id!)}
                      onChange={() => handleToggle('person', person.id!)}
                      className="w-5 h-5"
                    />
                    <span className="text-white font-medium">{person.name}</span>
                  </label>
                ))}
                {persons.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Keine Personen verfügbar
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Conditions */}
          {canAssignConditions && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">📝 Anwendungsgebiete</h3>
                {onQuickCreate && (
                  <button
                    onClick={() => onQuickCreate('condition')}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Neues Anwendungsgebiet
                  </button>
                )}
              </div>
              <div className="grid gap-2">
                {conditions.map(cond => (
                  <label
                    key={cond.id}
                    className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={assignedConditions.includes(cond.id!)}
                      onChange={() => handleToggle('condition', cond.id!)}
                      className="w-5 h-5"
                    />
                    <span className="text-white font-medium">{cond.name}</span>
                  </label>
                ))}
                {conditions.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Keine Anwendungsgebiete verfügbar
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-3 font-medium"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
