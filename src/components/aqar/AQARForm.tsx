import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Save, Send, Plus, Trash2, ChevronDown, ChevronUp,
  CheckCircle, Building2, Users, BookOpen, Microscope, GraduationCap,
  Shield, Lightbulb, Calendar
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AQARFormProps {
  year: string;
  onBack: () => void;
}

interface AqarData {
  aqar: any;
  autoPopulated: {
    partA: any;
    partB: any;
  };
}

const sectionIcons: Record<string, any> = {
  partA: Building2,
  criterion1: BookOpen,
  criterion2: Users,
  criterion3: Microscope,
  criterion5: GraduationCap,
  criterion6: Shield,
  criterion7: Lightbulb,
  partC: Calendar,
  partD: Lightbulb,
};

export default function AQARForm({ year, onBack }: AQARFormProps) {
  const [data, setData] = useState<AqarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['partA', 'partC', 'partD']));

  // Editable fields
  const [achievements, setAchievements] = useState('');
  const [futurePlans, setFuturePlans] = useState('');
  const [iqacComposition, setIqacComposition] = useState('');
  const [iqacMeetingCount, setIqacMeetingCount] = useState(0);
  const [collaborations, setCollaborations] = useState('');
  const [externalReviews, setExternalReviews] = useState('');

  // Activity form
  const [activityDate, setActivityDate] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [activityParticipants, setActivityParticipants] = useState(0);
  const [activityOutcome, setActivityOutcome] = useState('');
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/aqar/${year}`);
      const result = await res.json();
      setData(result);

      // Pre-fill editable fields from existing AQAR record
      if (result.aqar) {
        setAchievements(result.aqar.institutionalAchievements || '');
        setFuturePlans(result.aqar.futurePlans || '');
        setIqacComposition(result.aqar.iqacComposition || '');
        setIqacMeetingCount(result.aqar.iqacMeetingCount || 0);
        setCollaborations(result.aqar.collaborationActivities || '');
        setExternalReviews(result.aqar.externalQualityReviews || '');
        setActivities(result.aqar.iqacActivities || []);
      }
    } catch (err) {
      console.error('Failed to load AQAR data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (status: string = 'DRAFT') => {
    setSaving(true);
    try {
      await fetch(`/api/aqar/${year}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionalAchievements: achievements,
          futurePlans,
          iqacComposition,
          iqacMeetingCount,
          collaborationActivities: collaborations,
          externalQualityReviews: externalReviews,
          status,
        })
      });
      if (status === 'SUBMITTED') {
        alert('AQAR submitted successfully!');
        onBack();
      }
    } catch (err) {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddActivity = async () => {
    if (!activityDate || !activityDesc) return;
    try {
      const res = await fetch(`/api/aqar/${year}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityDate,
          description: activityDesc,
          participants: activityParticipants,
          outcome: activityOutcome,
        })
      });
      const activity = await res.json();
      setActivities([activity, ...activities]);
      setActivityDate('');
      setActivityDesc('');
      setActivityParticipants(0);
      setActivityOutcome('');
    } catch (err) {
      alert('Failed to add activity');
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      await fetch(`/api/aqar/${year}/activities/${id}`, { method: 'DELETE' });
      setActivities(activities.filter(a => a.id !== id));
    } catch (err) {
      alert('Failed to delete activity');
    }
  };

  const toggleSection = (section: string) => {
    const next = new Set(expandedSections);
    if (next.has(section)) next.delete(section); else next.add(section);
    setExpandedSections(next);
  };

  if (loading || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const { autoPopulated } = data;
  const pa = autoPopulated.partA;
  const pb = autoPopulated.partB;

  const CollapsibleSection = ({
    id, title, badge, children
  }: {
    id: string; title: string; badge?: string; children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.has(id);
    const Icon = sectionIcons[id] || BookOpen;
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800">{title}</h3>
            {badge && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200 uppercase">
                {badge}
              </span>
            )}
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="px-5 pb-5 border-t border-slate-100"
          >
            {children}
          </motion.div>
        )}
      </div>
    );
  };

  const DataRow = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
      <span className="text-sm text-slate-500 font-medium">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AQAR {year}</h1>
            <p className="text-sm text-slate-500">Annual Quality Assurance Report</p>
          </div>
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-bold border',
            data.aqar?.status === 'SUBMITTED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          )}>
            {data.aqar?.status || 'DRAFT'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to submit this AQAR? This marks it as final.')) {
                handleSave('SUBMITTED');
              }
            }}
            disabled={saving}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Submit to NAAC
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <span className="font-bold">Auto-populated from SSR data:</span> Part A and Part B are automatically filled from your existing NAAC criterion data. Only AQAR-specific fields (Part C & D) require manual input.
        </div>
      </div>

      {/* PART A: Institutional Details (Read-only) */}
      <CollapsibleSection id="partA" title="Part A — Institutional Details" badge="Auto-filled">
        <div className="mt-4 space-y-1">
          <DataRow label="Institution Name" value={pa.institutionName} />
          <DataRow label="AISHE Code" value={pa.aisheCode || 'N/A'} />
          <DataRow label="Type" value={pa.type || 'N/A'} />
          <DataRow label="Location" value={`${pa.city}, ${pa.state}`} />
          <DataRow label="Established" value={pa.established} />
          <DataRow label="Website" value={pa.website || 'N/A'} />
          <DataRow label="NAAC Cycle" value={pa.naacCycle} />
          <DataRow label="Last NAAC Grade" value={pa.naacGrade || 'N/A'} />
          <DataRow label="Total Programs" value={pa.totalPrograms} />
          <DataRow label="Total Students Enrolled" value={pa.totalStudents?.toLocaleString('en-IN')} />
          <DataRow label="Total Faculty" value={pa.totalFaculty} />
          <DataRow label="Faculty with PhD" value={pa.phdFaculty} />
        </div>
        {pa.enrollmentByCategory && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl">
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Enrollment by Category</h4>
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(pa.enrollmentByCategory).map(([cat, count]) => (
                <div key={cat} className="text-center p-2 bg-white rounded-lg">
                  <p className="text-lg font-bold text-slate-800">{String(count)}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400">{cat}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* PART B: Criterion-wise Summary (Read-only) */}
      <CollapsibleSection id="criterion1" title="Criterion I — Curricular Aspects" badge="Auto-filled">
        <div className="mt-4 space-y-1">
          <DataRow label="Value-Added Courses" value={pb.criterion1?.valueAddedCourses || 0} />
          <DataRow label="Students in Value-Added Courses" value={pb.criterion1?.valueAddedEnrollment || 0} />
          <DataRow label="Feedback Stakeholder Types" value={pb.criterion1?.feedbackTypes || 0} />
          <DataRow label="Feedback Action Taken" value={pb.criterion1?.feedbackActionTaken ? 'Yes' : 'No'} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="criterion2" title="Criterion II — Teaching-Learning" badge="Auto-filled">
        <div className="mt-4 space-y-1">
          <DataRow label="Total Enrolled" value={pb.criterion2?.totalEnrolled?.toLocaleString('en-IN') || 0} />
          <DataRow label="Sanctioned Intake" value={pb.criterion2?.totalSanctioned?.toLocaleString('en-IN') || 0} />
          <DataRow label="FDP Programs Conducted" value={pb.criterion2?.fdpCount || 0} />
          <DataRow label="Faculty in FDPs" value={pb.criterion2?.facultyInFDP || 0} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="criterion3" title="Criterion III — Research & Innovation" badge="Auto-filled">
        <div className="mt-4 space-y-1">
          <DataRow label="Total Publications" value={pb.criterion3?.totalPublications || 0} />
          <DataRow label="Scopus/WoS Publications" value={pb.criterion3?.scopusWos || 0} />
          <DataRow label="Total Research Grants" value={`₹${(pb.criterion3?.totalGrants || 0).toLocaleString('en-IN')}`} />
          <DataRow label="Active Projects" value={pb.criterion3?.activeProjects || 0} />
          <DataRow label="Patents Filed" value={pb.criterion3?.patentsFiled || 0} />
          <DataRow label="Patents Granted" value={pb.criterion3?.patentsGranted || 0} />
          <DataRow label="Extension Activities" value={pb.criterion3?.extensionActivities || 0} />
          <DataRow label="Total MoUs" value={pb.criterion3?.totalMoUs || 0} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="criterion5" title="Criterion V — Student Support" badge="Auto-filled">
        <div className="mt-4 space-y-1">
          <DataRow label="Students Placed" value={pb.criterion5?.studentsPlaced || 0} />
          <DataRow label="Average Package" value={`₹${(pb.criterion5?.avgPackageLPA || 0).toFixed(2)} LPA`} />
          <DataRow label="Scholarship Recipients" value={pb.criterion5?.scholarshipRecipients || 0} />
          <DataRow label="Total Scholarship Amount" value={`₹${(pb.criterion5?.scholarshipAmount || 0).toLocaleString('en-IN')}`} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="criterion6" title="Criterion VI — Governance" badge="Auto-filled">
        <div className="mt-4 space-y-1">
          <DataRow label="IQAC Meetings" value={pb.criterion6?.iqacMeetings || 0} />
          <DataRow label="Quality Initiatives" value={pb.criterion6?.qualityInitiatives || 0} />
          <DataRow label="E-Governance Areas" value={pb.criterion6?.eGovernanceAreas || 0} />
          <DataRow label="Avg E-Gov Implementation" value={`${(pb.criterion6?.avgEGovPercent || 0).toFixed(0)}%`} />
          <DataRow label="Internal Audit" value={pb.criterion6?.internalAudit ? 'Done' : 'Pending'} />
          <DataRow label="External Audit" value={pb.criterion6?.externalAudit ? 'Done' : 'Pending'} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="criterion7" title="Criterion VII — Best Practices" badge="Auto-filled">
        <div className="mt-4 space-y-3">
          {pb.criterion7?.bestPractices?.length > 0 ? (
            pb.criterion7.bestPractices.map((bp: any, i: number) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl">
                <p className="font-semibold text-sm text-slate-800">{bp.title}</p>
                <p className="text-xs text-slate-500 mt-1">{bp.objectives}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 italic">No best practices recorded yet.</p>
          )}
          {pb.criterion7?.distinctiveness && (
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-xs font-bold uppercase text-blue-600 mb-1">Institutional Distinctiveness</p>
              <p className="text-sm text-slate-700">{pb.criterion7.distinctiveness}</p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* PART C: IQAC Activities (Editable) */}
      <CollapsibleSection id="partC" title="Part C — IQAC Activities & Contributions" badge="Editable">
        <div className="mt-4 space-y-5">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">IQAC Composition</label>
            <textarea
              value={iqacComposition}
              onChange={e => setIqacComposition(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px] focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              placeholder="List IQAC members with their designations..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">IQAC Meetings Held</label>
              <input
                type="number"
                value={iqacMeetingCount}
                onChange={e => setIqacMeetingCount(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Collaboration Activities</label>
            <textarea
              value={collaborations}
              onChange={e => setCollaborations(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px] focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              placeholder="Describe collaboration activities during this year..."
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">External Quality Review Visits</label>
            <textarea
              value={externalReviews}
              onChange={e => setExternalReviews(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px] focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              placeholder="Details of external quality review visits..."
            />
          </div>

          {/* IQAC Activity Log */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              IQAC Activity Log
            </h4>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <input
                type="date"
                value={activityDate}
                onChange={e => setActivityDate(e.target.value)}
                className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm"
              />
              <input
                type="text"
                value={activityDesc}
                onChange={e => setActivityDesc(e.target.value)}
                placeholder="Activity description"
                className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm"
              />
              <input
                type="number"
                value={activityParticipants || ''}
                onChange={e => setActivityParticipants(Number(e.target.value))}
                placeholder="Participants"
                className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={activityOutcome}
                  onChange={e => setActivityOutcome(e.target.value)}
                  placeholder="Outcome"
                  className="flex-1 p-2.5 bg-white border border-slate-200 rounded-lg text-sm"
                />
                <button
                  onClick={handleAddActivity}
                  disabled={!activityDate || !activityDesc}
                  className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {activities.length > 0 ? (
              <div className="space-y-2">
                {activities.map(activity => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs font-mono text-slate-400 w-20">
                        {new Date(activity.activityDate).toLocaleDateString('en-IN')}
                      </span>
                      <span className="text-sm font-medium text-slate-700 flex-1">{activity.description}</span>
                      <span className="text-xs text-slate-400">{activity.participants} participants</span>
                      {activity.outcome && (
                        <span className="text-xs text-emerald-600 font-medium">{activity.outcome}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4 italic">No IQAC activities logged yet.</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* PART D: Achievements & Future Plans (Editable) */}
      <CollapsibleSection id="partD" title="Part D — Achievements & Future Plans" badge="Editable">
        <div className="mt-4 space-y-5">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Institutional Achievements During the Year</label>
            <textarea
              value={achievements}
              onChange={e => setAchievements(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[120px] focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              placeholder="Describe major achievements, awards, recognitions, and milestones during this academic year..."
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Future Plans for Quality Improvement</label>
            <textarea
              value={futurePlans}
              onChange={e => setFuturePlans(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[120px] focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              placeholder="Outline strategic plans, upcoming initiatives, and quality improvement targets for the next academic year..."
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Bottom action bar */}
      <div className="flex justify-end gap-3 pt-4 pb-8">
        <button
          onClick={() => handleSave('DRAFT')}
          disabled={saving}
          className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={() => {
            if (confirm('Submit this AQAR to NAAC? This marks it as final.')) {
              handleSave('SUBMITTED');
            }
          }}
          disabled={saving}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          Submit to NAAC
        </button>
      </div>
    </motion.div>
  );
}
