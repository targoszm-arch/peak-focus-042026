// Bridges the Peak Focus design-system prototype to the app: it exposes React
// and the DS component namespace (the exact `window.PeakFocusDesignSystem_2ecfec`
// the screens read) so the *unmodified* prototype screens run in the Vite build.
import React from "react";
import {
  Icon, Button, IconButton, Input, Select, Checkbox, Radio, Switch,
  Avatar, AvatarGroup, Badge, Tag, ProgressBar, Card, StatCard, NavItem, Tabs,
} from "@/ds";

/* eslint-disable @typescript-eslint/no-explicit-any */
const w = window as any;

w.React = React;
w.PeakFocusDesignSystem_2ecfec = {
  Icon, Button, IconButton, Input, Select, Checkbox, Radio, Switch,
  Avatar, AvatarGroup, Badge, Tag, ProgressBar, Card, StatCard, NavItem, Tabs,
};

// Populate the mock PFData / PFDate / PFProject / TaskRow / QuickAdd globals,
// then register every screen (each assigns window.<Name>Screen).
import "./screens/data.js";
import "./screens/logo-data.js";
import "./screens/sound.js";
import "./screens/confetti.js";
import "./screens/TaskRow.jsx";
import "./screens/Sidebar.jsx";
import "./screens/PeakProgress.jsx";
import "./screens/EditModals.jsx";
import "./screens/ProjectViews.jsx";
import "./screens/TodayScreen.jsx";
import "./screens/TasksScreen.jsx";
import "./screens/ProjectsScreen.jsx";
import "./screens/ProjectDetailScreen.jsx";
import "./screens/ClientsScreen.jsx";
import "./screens/PeopleScreen.jsx";
import "./screens/HabitsScreen.jsx";
import "./screens/FocusScreen.jsx";
import "./screens/HealthScreen.jsx";
import "./screens/IntegrationsScreen.jsx";
import "./screens/DashboardScreen.jsx";
import "./screens/SignInScreen.jsx";

export const PF = w;
