
import React from 'react';
import TaskList from '@/components/tasks/TaskList';
import { sampleTasks } from '@/data/sampleData';

const Tasks = () => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
      </div>
      
      <TaskList tasks={sampleTasks} />
    </div>
  );
};

export default Tasks;
