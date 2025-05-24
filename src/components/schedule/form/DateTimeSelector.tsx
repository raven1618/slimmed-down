
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface DateTimeSelectorProps {
  selectedDate: Date | undefined;
  scheduledTime: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
}

export default function DateTimeSelector({
  selectedDate,
  scheduledTime,
  onDateChange,
  onTimeChange
}: DateTimeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Scheduled Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduledTime">Scheduled Time</Label>
        <div className="relative">
          <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="scheduledTime"
            type="time"
            value={scheduledTime}
            onChange={(e) => onTimeChange(e.target.value)}
            className="pl-9"
            required
          />
        </div>
      </div>
    </div>
  );
}
