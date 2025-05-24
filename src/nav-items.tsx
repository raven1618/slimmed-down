
import React from 'react';
import Dashboard from './pages/Dashboard';
import PatientCases from './pages/PatientCases';
import Dispatch from './pages/Dispatch';
import Fleet from './pages/Fleet';
import Crew from './pages/Crew';
import Facilities from './pages/Facilities';
import Schedule from './pages/Schedule';
import Tasks from './pages/Tasks';
import Billing from './pages/Billing';
import Authorizations from './pages/Authorizations';
import Operations from './pages/Operations';
import Performance from './pages/Performance';
import Settings from './pages/Settings';

export const navItems = [
  {
    to: "/",
    page: <Dashboard />,
  },
  {
    to: "/dashboard",
    page: <Dashboard />,
  },
  {
    to: "/patient-cases",
    page: <PatientCases />,
  },
  {
    to: "/patient-cases/:id",
    page: <PatientCases />,
  },
  {
    to: "/dispatch",
    page: <Dispatch />,
  },
  {
    to: "/fleet",
    page: <Fleet />,
  },
  {
    to: "/crew",
    page: <Crew />,
  },
  {
    to: "/facilities",
    page: <Facilities />,
  },
  {
    to: "/facilities/:id",
    page: <Facilities />,
  },
  {
    to: "/schedule",
    page: <Schedule />,
  },
  {
    to: "/tasks",
    page: <Tasks />,
  },
  {
    to: "/billing",
    page: <Billing />,
  },
  {
    to: "/authorizations",
    page: <Authorizations />,
  },
  {
    to: "/authorizations/:id",
    page: <Authorizations />,
  },
  {
    to: "/operations",
    page: <Operations />,
  },
  {
    to: "/performance",
    page: <Performance />,
  },
  {
    to: "/settings",
    page: <Settings />,
  },
];
