
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Users, Truck } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns';

export default function ScheduleOverview() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Mock data for demonstration
  const shifts = [
    { id: '1', date: new Date(), crewMember: 'John Doe', startTime: '08:00', endTime: '16:00', type: 'regular' },
    { id: '2', date: new Date(), crewMember: 'Jane Smith', startTime: '16:00', endTime: '00:00', type: 'night' },
    { id: '3', date: addDays(new Date(), 1), crewMember: 'Mike Johnson', startTime: '08:00', endTime: '16:00', type: 'regular' },
  ];

  const transports = [
    { id: '1', date: new Date(), time: '10:30', pickup: 'Hospital A', destination: 'Hospital B', crew: 'John Doe', vehicle: 'AMB-001' },
    { id: '2', date: new Date(), time: '14:15', pickup: 'Clinic C', destination: 'Hospital A', crew: 'Jane Smith', vehicle: 'AMB-002' },
    { id: '3', date: addDays(new Date(), 1), time: '09:00', pickup: 'Hospital B', destination: 'Clinic D', crew: 'Mike Johnson', vehicle: 'AMB-003' },
  ];

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const getItemsForDay = (date: Date, type: 'shifts' | 'transports') => {
    const items = type === 'shifts' ? shifts : transports;
    return items.filter(item => isSameDay(item.date, date));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Week
              </Button>
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
              >
                Month
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </h3>
              <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'week' && (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`min-h-[200px] border rounded-lg p-2 ${
                    isToday(day) ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}
                >
                  <div className="font-semibold text-sm mb-2">
                    {format(day, 'EEE d')}
                  </div>
                  
                  {/* Shifts */}
                  <div className="space-y-1 mb-2">
                    {getItemsForDay(day, 'shifts').map((shift) => (
                      <div key={shift.id} className="bg-blue-100 text-blue-800 p-1 rounded text-xs">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="truncate">{shift.crewMember}</span>
                        </div>
                        <div className="text-xs">{shift.startTime}-{shift.endTime}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Transports */}
                  <div className="space-y-1">
                    {getItemsForDay(day, 'transports').map((transport) => (
                      <div key={transport.id} className="bg-green-100 text-green-800 p-1 rounded text-xs">
                        <div className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          <span className="text-xs">{transport.time}</span>
                        </div>
                        <div className="text-xs truncate">{transport.pickup} → {transport.destination}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
