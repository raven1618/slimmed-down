
import React, { useState } from 'react';
import { Task } from '@/data/sampleData';
import { Check, Clock, CalendarIcon, ChevronDown, Truck, Wrench, Shield, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TaskListProps {
  tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Task['category']>('all');
  
  const filteredTasks = tasks.filter(task => {
    let matchesDateFilter = true;
    if (filter === 'completed') {
      matchesDateFilter = task.completed;
    } else if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      matchesDateFilter = task.dueDate === today && !task.completed;
    } else if (filter === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      matchesDateFilter = task.dueDate > today && !task.completed;
    }
    
    const matchesCategoryFilter = categoryFilter === 'all' || task.category === categoryFilter;
    
    return matchesDateFilter && matchesCategoryFilter;
  });

  const handleComplete = (taskId: string) => {
    console.log('Task completed:', taskId);
    // In a real app, this would update the task's completed status
  };

  const getPriorityClass = (priority: Task['priority']) => {
    switch(priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: Task['category']) => {
    switch(category) {
      case 'transport': return Truck;
      case 'vehicle': return Wrench;
      case 'compliance': return Shield;
      case 'crew': return Users;
      case 'facility': return Building2;
      default: return Clock;
    }
  };

  const getCategoryClass = (category: Task['category']) => {
    switch(category) {
      case 'transport': return 'bg-blue-100 text-blue-800';
      case 'vehicle': return 'bg-orange-100 text-orange-800';
      case 'compliance': return 'bg-purple-100 text-purple-800';
      case 'crew': return 'bg-green-100 text-green-800';
      case 'facility': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const CategoryIcon = getCategoryIcon(task.category);
    
    return (
      <div className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-start gap-3">
          <Button
            size="icon"
            variant="outline"
            className={`rounded-full h-6 w-6 mt-1 ${task.completed ? 'bg-green-100 border-green-300' : ''}`}
            onClick={() => handleComplete(task.id)}
          >
            {task.completed && <Check className="h-3 w-3" />}
          </Button>
          
          <div className="flex-1">
            <div className="flex flex-wrap justify-between items-start gap-2">
              <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                {task.title}
              </h3>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getCategoryClass(task.category)}`}>
                  <CategoryIcon className="h-3 w-3" />
                  {task.category}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-1">Related to: {task.related}</p>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center text-xs text-gray-500">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    Actions <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Reschedule</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h2 className="text-lg font-medium">Operational Tasks</h2>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Category: {categoryFilter === 'all' ? 'All' : categoryFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setCategoryFilter('all')}>All Categories</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter('transport')}>Transport</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter('vehicle')}>Vehicle</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter('compliance')}>Compliance</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter('crew')}>Crew</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCategoryFilter('facility')}>Facility</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="bg-blue-600 hover:bg-blue-700">Add Task</Button>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <div className="px-4 pt-3 border-b border-gray-200">
          <TabsList className="grid grid-cols-4 gap-4 w-full">
            <TabsTrigger value="all" onClick={() => setFilter('all')}>All</TabsTrigger>
            <TabsTrigger value="today" onClick={() => setFilter('today')}>Today</TabsTrigger>
            <TabsTrigger value="upcoming" onClick={() => setFilter('upcoming')}>Upcoming</TabsTrigger>
            <TabsTrigger value="completed" onClick={() => setFilter('completed')}>Completed</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0 p-0">
          <div className="divide-y divide-gray-100">
            {filteredTasks.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>No tasks found for the selected filters</p>
              </div>
            ) : (
              filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="today" className="mt-0 p-0">
          <div className="divide-y divide-gray-100">
            {filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-0 p-0">
          <div className="divide-y divide-gray-100">
            {filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-0 p-0">
          <div className="divide-y divide-gray-100">
            {filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
