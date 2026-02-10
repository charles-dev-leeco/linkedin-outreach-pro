import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Sparkles, Edit2, RefreshCw } from 'lucide-react';
import { campaignsApi, templatesApi, prospectsApi } from '../lib/api';
import type { CampaignTone } from '@linkedin-outreach-pro/shared';

const STEPS = ['Details', 'Templates', 'Prospects', 'Review'];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Step 1: Campaign Details
  const [campaignName, setCampaignName] = useState('');
  const [goal, setGoal] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState<CampaignTone>('professional');
  const [keyPoints, setKeyPoints] = useState('');
  
  // Step 2: Templates
  const [templates, setTemplates] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [refineFeedback, setRefineFeedback] = useState('');
  
  // Step 3: Prospects
  const [prospects, setProspects] = useState<any[]>([]);
  const [fileContent, setFileContent] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  
  // Step 4: Schedule
  const [scheduleDays, setScheduleDays] = useState([2, 3, 4]); // Tue, Wed, Thu
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [dailyLimit, setDailyLimit] = useState(25);

  const generateTemplatesMutation = useMutation({
    mutationFn: templatesApi.generate,
    onSuccess: (data) => {
      setTemplates(data.data!.templates.map(t => t.text));
      setIsGenerating(false);
    },
    onError: () => {
      alert('Failed to generate templates. Please try again.');
      setIsGenerating(false);
    },
  });

  const refineTemplateMutation = useMutation({
    mutationFn: ({ template, feedback }: { template: string; feedback: string }) =>
      templatesApi.refine(template, feedback, { goal, targetAudience, tone }),
    onSuccess: (data, variables) => {
      const index = templates.indexOf(variables.template);
      const newTemplates = [...templates];
      newTemplates[index] = data.data!.template;
      setTemplates(newTemplates);
      setRefineFeedback('');
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      const campaignData = {
        name: campaignName,
        goal,
        targetAudience,
        tone,
        templates,
        scheduleDays,
        scheduleTime,
        dailyLimit,
      };

      const response = await campaignsApi.create(campaignData);
      const campaign = response.data!;

      // Import prospects
      await prospectsApi.import(campaign.id, prospects);

      return campaign;
    },
    onSuccess: (campaign) => {
      navigate(`/campaigns/${campaign.id}`);
    },
    onError: (error: any) => {
      console.error('Campaign creation failed:', error);
      alert(`Failed to create campaign: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleGenerateTemplates = () => {
    if (!goal || !targetAudience) {
      alert('Please fill in campaign goal and target audience first.');
      return;
    }

    setIsGenerating(true);
    generateTemplatesMutation.mutate({
      goal,
      targetAudience,
      tone,
      keyPoints: keyPoints || undefined,
      existingTemplates: templates.length > 0 ? templates : undefined,
    });
  };

  const handleRefineTemplate = (template: string) => {
    if (!refineFeedback.trim()) return;
    refineTemplateMutation.mutate({ template, feedback: refineFeedback });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const fileType = file.name.endsWith('.csv') ? 'csv' : 'xlsx';

      try {
        const response = await prospectsApi.parse(
          fileType === 'csv' ? content : btoa(content),
          fileType
        );

        setProspects(response.data!.prospects);
        setIsParsing(false);
      } catch (error) {
        alert('Failed to parse file. Please check the format.');
        setIsParsing(false);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return campaignName && goal && targetAudience;
      case 1:
        return templates.length >= 1;
      case 2:
        return prospects.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      createCampaignMutation.mutate();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/campaigns');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/campaigns')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Campaigns</span>
      </button>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Campaign</h1>
        <p className="text-gray-600 mb-8">Set up your LinkedIn outreach automation</p>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                index <= currentStep
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-300 text-gray-500'
              }`}>
                {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <span className={`ml-2 font-medium ${
                index <= currentStep ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step}
              </span>
              {index < STEPS.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-primary-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {/* Step 1: Campaign Details */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label className="label">Campaign Name</label>
                <input
                  type="text"
                  className="input"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Tech Recruiting Q1 2024"
                />
              </div>

              <div>
                <label className="label">Campaign Goal</label>
                <textarea
                  className="input"
                  rows={3}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="What do you want to achieve with this outreach? e.g., Recruit senior engineers for our startup"
                />
              </div>

              <div>
                <label className="label">Target Audience</label>
                <input
                  type="text"
                  className="input"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Senior Software Engineers at Series A startups"
                />
              </div>

              <div>
                <label className="label">Tone</label>
                <div className="grid grid-cols-3 gap-4">
                  {(['professional', 'friendly', 'direct'] as CampaignTone[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        tone === t
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium capitalize">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Key Points (Optional)</label>
                <textarea
                  className="input"
                  rows={2}
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder="Any specific points to mention? e.g., Remote-first culture, equity compensation"
                />
              </div>
            </div>
          )}

          {/* Step 2: Templates */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {templates.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Sparkles className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate AI Templates</h3>
                  <p className="text-gray-600 mb-6">
                    We'll create personalized templates based on your campaign details
                  </p>
                  <button
                    onClick={handleGenerateTemplates}
                    disabled={isGenerating}
                    className="btn btn-primary"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Templates'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Generated Templates</h3>
                    <button
                      onClick={handleGenerateTemplates}
                      className="btn btn-secondary flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Regenerate</span>
                    </button>
                  </div>

                  {templates.map((template, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Template {index + 1}</span>
                        <button
                          onClick={() => {
                            setEditingIndex(index);
                            setEditText(template);
                          }}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>

                      {editingIndex === index ? (
                        <div className="space-y-3">
                          <textarea
                            className="input"
                            rows={4}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                          />
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                const newTemplates = [...templates];
                                newTemplates[index] = editText;
                                setTemplates(newTemplates);
                                setEditingIndex(null);
                              }}
                              className="btn btn-primary btn-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="btn btn-secondary btn-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-900 mb-3">{template}</p>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              className="input flex-1 text-sm"
                              placeholder="Feedback to refine this template..."
                              value={refineFeedback}
                              onChange={(e) => setRefineFeedback(e.target.value)}
                            />
                            <button
                              onClick={() => handleRefineTemplate(template)}
                              disabled={!refineFeedback.trim() || refineTemplateMutation.isPending}
                              className="btn btn-primary btn-sm"
                            >
                              Refine
                            </button>
                          </div>
                        </>
                      )}
                      
                      <div className="mt-2 text-xs text-gray-500">
                        {template.length}/300 characters
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Prospects */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="label">Upload Prospects (CSV or Excel)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="text-gray-600 mb-2">
                      {isParsing ? 'Parsing file...' : 'Click to upload or drag and drop'}
                    </div>
                    <div className="text-sm text-gray-500">
                      CSV or Excel file with columns: LinkedIn_URL, First_Name, Last_Name (optional), Company (optional), Role (optional)
                    </div>
                  </label>
                </div>
              </div>

              {prospects.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Imported Prospects ({prospects.length})
                    </h3>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {prospects.slice(0, 10).map((prospect, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {prospect.firstName} {prospect.lastName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{prospect.company || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{prospect.role || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {prospects.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2">
                      ...and {prospects.length - 10} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Summary</h3>
                
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-gray-600">Name</dt>
                    <dd className="text-gray-900 font-medium">{campaignName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Goal</dt>
                    <dd className="text-gray-900">{goal}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Target Audience</dt>
                    <dd className="text-gray-900">{targetAudience}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Templates</dt>
                    <dd className="text-gray-900">{templates.length} variants</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Prospects</dt>
                    <dd className="text-gray-900">{prospects.length} contacts</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Schedule</dt>
                    <dd className="text-gray-900">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                        .filter((_, i) => scheduleDays.includes(i))
                        .join(', ')} at {scheduleTime} EST
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Daily Limit</dt>
                    <dd className="text-gray-900">{dailyLimit} connections/day</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button onClick={handleBack} className="btn btn-secondary flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>{currentStep === 0 ? 'Cancel' : 'Back'}</span>
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || createCampaignMutation.isPending}
            className="btn btn-primary flex items-center space-x-2"
          >
            <span>
              {currentStep === STEPS.length - 1
                ? createCampaignMutation.isPending
                  ? 'Creating...'
                  : 'Create Campaign'
                : 'Next'}
            </span>
            {currentStep < STEPS.length - 1 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
