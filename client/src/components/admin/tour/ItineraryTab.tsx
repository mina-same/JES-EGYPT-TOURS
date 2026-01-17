import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Plus, X } from 'lucide-react';

interface ItineraryTabProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  addItineraryDay: () => void;
  removeItineraryDay: (index: number) => void;
  updateItineraryDay: (index: number, field: string, value: any) => void;
  handleImageUpload: (file: File) => Promise<{ url: string, fileName: string } | null>;
}

export default function ItineraryTab({
  formData,
  handleChange,
  addItineraryDay,
  removeItineraryDay,
  updateItineraryDay,
  handleImageUpload,
}: ItineraryTabProps) {
  return (
    <div className="space-y-6">
      {/* General Description */}
      <Card>
        <CardHeader>
          <CardTitle>General Itinerary Description</CardTitle>
          <CardDescription>Overview of the tour itinerary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="itinerary.generalDescription">General Description</Label>
            <RichTextEditor
              value={formData.itinerary?.generalDescription || ''}
              onChange={(value) => handleChange('itinerary.generalDescription', value)}
              placeholder="Provide an overview of the tour itinerary..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Itinerary Days */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Itinerary</CardTitle>
          <CardDescription>Add day-by-day tour schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.itinerary?.days?.map((day: any, dayIndex: number) => (
            <div key={dayIndex} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-lg">Day {day.day}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItineraryDay(dayIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Day Title *</Label>
                  <Input
                    value={day.title}
                    onChange={(e) => updateItineraryDay(dayIndex, 'title', e.target.value)}
                    placeholder="e.g., Arrival in Cairo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Day Description *</Label>
                  <RichTextEditor
                    value={day.description}
                    onChange={(value) => updateItineraryDay(dayIndex, 'description', value)}
                    placeholder="Describe what happens on this day..."
                  />
                </div>

                {/* Activities */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Activities</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newActivities = [
                          ...(day.activities || []),
                          { heading: '', description: '', image: null }
                        ];
                        updateItineraryDay(dayIndex, 'activities', newActivities);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Activity
                    </Button>
                  </div>

                  {day.activities?.map((activity: any, actIndex: number) => (
                    <div key={actIndex} className="p-3 bg-gray-50 rounded space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Activity {actIndex + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newActivities = day.activities.filter((_: any, i: number) => i !== actIndex);
                            updateItineraryDay(dayIndex, 'activities', newActivities);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Activity Heading</Label>
                        <Input
                          value={activity.heading}
                          onChange={(e) => {
                            const newActivities = [...day.activities];
                            newActivities[actIndex] = { ...activity, heading: e.target.value };
                            updateItineraryDay(dayIndex, 'activities', newActivities);
                          }}
                          placeholder="e.g., Visit the Pyramids"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Activity Description</Label>
                        <RichTextEditor
                          value={activity.description}
                          onChange={(value) => {
                            const newActivities = [...day.activities];
                            newActivities[actIndex] = { ...activity, description: value };
                            updateItineraryDay(dayIndex, 'activities', newActivities);
                          }}
                          placeholder="Describe this activity..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Activity Image (Optional)</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const result = await handleImageUpload(file);
                              if (result) {
                                const newActivities = [...day.activities];
                                newActivities[actIndex] = {
                                  ...activity,
                                  image: {
                                    url: result.url,
                                    fileName: result.fileName,
                                    title: activity.heading,
                                    alt: activity.heading,
                                  }
                                };
                                updateItineraryDay(dayIndex, 'activities', newActivities);
                              }
                            }
                          }}
                        />
                        {activity.image?.url && (
                          <div className="mt-2">
                            <img
                              src={activity.image.url}
                              alt={activity.image.alt || 'Activity'}
                              className="w-full h-32 object-cover rounded"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <Button type="button" onClick={addItineraryDay} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Day
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
