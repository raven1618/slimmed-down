import React, { useState } from 'react';
import { Task } from '@/data/sampleData';
import { Check, Clock, CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
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
  
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'completed') return task.completed;
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return task.dueDate === today && !task.completed;
    }
    if (filter === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      return task.dueDate > today && !task.completed;
    }
    return true;
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h2 className="text-lg font-medium">Tasks</h2>
          <Button className="bg-crm-blue hover:bg-blue-700">Add Task</Button>
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
                <p>No tasks found</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
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
                      <div className="flex flex-wrap justify-between">
                        <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.related && (
                        <p className="text-sm text-gray-500 mt-1">Related to: {task.related}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2">
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
              ))
            )}
          </div>
        </TabsContent>

        {/* Other tab contents work the same way thanks to our filter state */}
        <TabsContent value="today" className="mt-0 p-0">
          <div className="divide-y divide-gray-100">
            {filteredTasks.filter(task => {
                const today = new Date().toISOString().split('T')[0];
                return task.dueDate === today;
              }).map((task) => (
                <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
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
                      <div className="flex flex-wrap justify-between">
                        <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.related && (
                        <p className="text-sm text-gray-500 mt-1">Related to: {task.related}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2">
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
              ))
            }
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-0 p-0">
          <div className="divide-y divide-gray-100">
            {filteredTasks.filter(task => {
                const today = new Date().toISOString().split('T')[0];
                return task.dueDate > today;
              }).map((task) => (
                <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
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
                      <div className="flex flex-wrap justify-between">
                        <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.related && (
                        <p className="text-sm text-gray-500 mt-1">Related to: {task.related}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2">
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
              ))
            }
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-0 p-0">
          <div className="divide-y divide-gray-100">
            {filteredTasks.filter(task => task.completed).map((task) => (
                <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
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
                      <div className="flex flex-wrap justify-between">
                        <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.related && (
                        <p className="text-sm text-gray-500 mt-1">Related to: {task.related}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2">
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
              ))
            }
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
