const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path')

dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

//Models
const User = require('../models/User.js');
const Project      = require('../models/Project');
const Task         = require('../models/Task');
const Comment      = require('../models/Comment');
const Notification = require('../models/Notification');

//Connect with DB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected for Seeding")
    } catch (err) {
        console.error('❌ MongoDB Connection Failed:', err.message);
        process.exit(1);
    }
}

//Clear all collections
const clearDB = async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Comment.deleteMany({});
    await Notification.deleteMany({});
    console.log('🗑️  All collections cleared');
}

//Seed User 
const seedUser = async () => {
    const salt = await bcrypt.genSalt(10);

    const users = await User.insertMany([
        {
            name: 'Kaushal Patel',
            email: 'kaushalpatel2506@gmail.com',
            password: await bcrypt.hash('kaushal', salt),
            role: 'Admin',
            avatar: '',
            notificationPreferences: {
                email: true,
                push: true
            },
            appearance: { theme: 'dark' }
        },
        {
            name: 'Shreya Lad',
            email: 'shreyalad2605@gmail.com',
            password: await bcrypt.hash('shreya', salt),
            role: 'Project Manager',
            avatar: '',
            notificationPreferences: {
                email: true,
                push: true
            },
            appearance: {theme: 'dark'}
        },
        {
            name: 'Drashti Savaliya',
            email: 'drashtisavaliya05@gmail.com',
            password: await bcrypt.hash('drashti', salt),
            role: 'Team Member',
            avatar: '',
            notificationPreferences: {
                email: true,
                push: true
            },
            appearance: {theme: 'dark'}
        },
        {
            name: 'Hiya Modi',
            email: 'hiyamodi@gmail.com',
            password: await bcrypt.hash('hiya123', salt),
            role: 'Team Member',
            avatar: '',
            notificationPreferences: {
                email: true,
                push: true
            },
            appearance: {theme: 'dark'}
        },
        {
            name: 'Manav Surti',
            email: 'manavmsurti@gmail.com',
            password: await bcrypt.hash('manav123', salt),
            role: 'Team Member',
            avatar: '',
            notificationPreferences: {
                email: true,
                push: true
            },
            appearance: {theme: 'dark'}
        },

    ]);

    console.log(`👥 ${users.length} Users seeded`);
    return users;
}

// ─── Seed Projects ────────────────────────────────────────────────────────────
const seedProjects = async (users) => {
  const [kaushal, shreya, drashti, hiya, manav] = users;

  const projects = await Project.insertMany([
    {
      name:        'E-Commerce Platform Redesign',
      description: 'Complete overhaul of the existing e-commerce platform with modern UI/UX and improved performance.',
      status:      'Active',
      priority:    'High',
      startDate:   new Date('2026-05-01'),
      endDate:     new Date('2026-07-31'),
      owner:       kaushal._id,
      members: [
        { user: kaushal._id, role: 'Admin' },
        { user: shreya._id,   role: 'Project Manager' },
        { user: drashti._id,   role: 'Team Member' },
        { user: hiya._id,   role: 'Team Member' }
      ]
    },
    {
      name:        'Mobile App Development',
      description: 'Build a cross-platform mobile application for iOS and Android using React Native.',
      status:      'Active',
      priority:    'Critical',
      startDate:   new Date('2026-05-15'),
      endDate:     new Date('2026-08-15'),
      owner:       kaushal._id,
      members: [
        { user: kaushal._id, role: 'Admin' },
        { user: manav._id,   role: 'Project Manager' },
        { user: drashti._id,   role: 'Team Member' }
      ]
    },
    {
      name:        'Internal HR Management System',
      description: 'Develop an internal tool for HR to manage employee records, leaves and performance reviews.',
      status:      'Planning',
      priority:    'Medium',
      startDate:   new Date('2026-06-01'),
      endDate:     new Date('2026-09-30'),
      owner:       drashti._id,
      members: [
        { user: drashti._id,   role: 'Admin' },
        { user: kaushal._id, role: 'Project Manager' },
        { user: shreya._id,   role: 'Team Member' },
        { user: manav._id,   role: 'Team Member' }
      ]
    },
    {
      name:        'API Integration Layer',
      description: 'Build a centralized API integration layer to connect all third-party services.',
      status:      'Active',
      priority:    'High',
      startDate:   new Date('2026-04-01'),
      endDate:     new Date('2026-06-30'),
      owner:       shreya._id,
      members: [
        { user: shreya._id, role: 'Admin' },
        { user: hiya._id,   role: 'Project Manager' },
        { user: drashti._id,   role: 'Team Member' }
      ]
    },
    {
      name:        'Data Analytics Dashboard',
      description: 'Create a real-time analytics dashboard to visualize business KPIs and metrics.',
      status:      'On Hold',
      priority:    'Low',
      startDate:   new Date('2026-07-01'),
      endDate:     new Date('2026-10-31'),
      owner:       manav._id,
      members: [
        { user: manav._id,   role: 'Admin' },
        { user: kaushal._id, role: 'Team Member' },
        { user: shreya._id,   role: 'Team Member' }
      ]
    }
  ]);

  console.log(`📁 ${projects.length} Projects seeded`);
  return projects;
};

// ─── Seed Tasks ───────────────────────────────────────────────────────────────
const seedTasks = async (users, projects) => {
  const [kaushal, shreya, drashti, hiya, manav] = users;
  const [ecommerce, mobile, hr, api, analytics] = projects;

  const now   = new Date();
  const day   = 24 * 60 * 60 * 1000;

  const tasks = await Task.insertMany([

    // ── E-Commerce Project Tasks ──────────────────────────────────────────────
    {
      title:       'Design new homepage mockup',
      description: 'Create Figma designs for the new homepage with hero section, featured products and footer.',
      status:      'Done',
      priority:    'High',
      project:     ecommerce._id,
      assignedTo:  shreya._id,
      createdBy:   kaushal._id,
      dueDate:     new Date(now.getTime() - 5 * day),
      completedAt: new Date(now.getTime() - 3 * day),
      tags:        ['design', 'figma', 'ui'],
      order:       1
    },
    {
      title:       'Setup React project structure',
      description: 'Initialize React app with Vite, configure Tailwind CSS, ESLint and folder structure.',
      status:      'Done',
      priority:    'High',
      project:     ecommerce._id,
      assignedTo:  hiya._id,
      createdBy:   kaushal._id,
      dueDate:     new Date(now.getTime() - 4 * day),
      completedAt: new Date(now.getTime() - 2 * day),
      tags:        ['react', 'setup', 'frontend'],
      order:       2
    },
    {
      title:       'Build product listing page',
      description: 'Implement product grid with filters, search and pagination.',
      status:      'In Progress',
      priority:    'High',
      project:     ecommerce._id,
      assignedTo:  manav._id,
      createdBy:   shreya._id,
      dueDate:     new Date(now.getTime() + 3 * day),
      tags:        ['frontend', 'react', 'products'],
      order:       1
    },
    {
      title:       'Implement shopping cart functionality',
      description: 'Build cart with add/remove items, quantity update and local storage persistence.',
      status:      'In Progress',
      priority:    'Critical',
      project:     ecommerce._id,
      assignedTo:  drashti._id,
      createdBy:   kaushal._id,
      dueDate:     new Date(now.getTime() + 4 * day),
      tags:        ['frontend', 'cart', 'state'],
      order:       2
    },
    {
      title:       'Payment gateway integration',
      description: 'Integrate Razorpay payment gateway with success and failure handlers.',
      status:      'Todo',
      priority:    'Critical',
      project:     ecommerce._id,
      assignedTo:  kaushal._id,
      createdBy:   kaushal._id,
      dueDate:     new Date(now.getTime() + 7 * day),
      tags:        ['backend', 'payment', 'razorpay'],
      order:       1
    },
    {
      title:       'Write API documentation',
      description: 'Document all REST API endpoints using Swagger.',
      status:      'Backlog',
      priority:    'Low',
      project:     ecommerce._id,
      assignedTo:  shreya._id,
      createdBy:   drashti._id,
      dueDate:     new Date(now.getTime() + 14 * day),
      tags:        ['documentation', 'swagger'],
      order:       1
    },
    {
      title:       'Code review for cart module',
      description: 'Review the shopping cart implementation and provide feedback.',
      status:      'Review',
      priority:    'Medium',
      project:     ecommerce._id,
      assignedTo:  drashti._id,
      createdBy:   kaushal._id,
      dueDate:     new Date(now.getTime() + 2 * day),
      tags:        ['review', 'cart'],
      order:       1
    },

    // ── Mobile App Project Tasks ───────────────────────────────────────────────
    {
      title:       'Setup React Native environment',
      description: 'Configure React Native with Expo, install dependencies and test on emulator.',
      status:      'Done',
      priority:    'High',
      project:     mobile._id,
      assignedTo:  drashti._id,
      createdBy:   kaushal._id,
      dueDate:     new Date(now.getTime() - 6 * day),
      completedAt: new Date(now.getTime() - 4 * day),
      tags:        ['react-native', 'setup', 'expo'],
      order:       1
    },
    {
      title:       'Design app navigation flow',
      description: 'Create bottom tab navigator with stack navigators for each section.',
      status:      'In Progress',
      priority:    'High',
      project:     mobile._id,
      assignedTo:  shreya._id,
      createdBy:   kaushal._id,
      dueDate:     new Date(now.getTime() + 2 * day),
      tags:        ['navigation', 'ui'],
      order:       1
    },
    {
      title:       'Build authentication screens',
      description: 'Create Login, Register and Forgot Password screens with form validation.',
      status:      'Todo',
      priority:    'Critical',
      project:     mobile._id,
      assignedTo:  kaushal._id,
      createdBy:   shreya._id,
      dueDate:     new Date(now.getTime() + 5 * day),
      tags:        ['auth', 'screens', 'forms'],
      order:       1
    },
    {
      title:       'Push notification setup',
      description: 'Configure Firebase Cloud Messaging for push notifications on both platforms.',
      status:      'Backlog',
      priority:    'Medium',
      project:     mobile._id,
      assignedTo:  hiya._id,
      createdBy:   manav._id,
      dueDate:     new Date(now.getTime() + 10 * day),
      tags:        ['firebase', 'notifications'],
      order:       1
    },

    // ── HR System Tasks ────────────────────────────────────────────────────────
    {
      title:       'Gather requirements from HR team',
      description: 'Schedule meetings with HR stakeholders to document all requirements.',
      status:      'Done',
      priority:    'High',
      project:     hr._id,
      assignedTo:  hiya._id,
      createdBy:   shreya._id,
      dueDate:     new Date(now.getTime() - 3 * day),
      completedAt: new Date(now.getTime() - 1 * day),
      tags:        ['requirements', 'planning'],
      order:       1
    },
    {
      title:       'Design database schema for employees',
      description: 'Create MongoDB schema for employee records, departments and roles.',
      status:      'In Progress',
      priority:    'High',
      project:     hr._id,
      assignedTo:  manav._id,
      createdBy:   drashti._id,
      dueDate:     new Date(now.getTime() + 3 * day),
      tags:        ['database', 'schema', 'mongodb'],
      order:       1
    },
    {
      title:       'Build employee onboarding flow',
      description: 'Create multi-step onboarding form for new employees.',
      status:      'Todo',
      priority:    'Medium',
      project:     hr._id,
      assignedTo:  kaushal._id,
      createdBy:   hiya._id,
      dueDate:     new Date(now.getTime() + 8 * day),
      tags:        ['forms', 'onboarding'],
      order:       1
    },

    // ── API Integration Tasks ──────────────────────────────────────────────────
    {
      title:       'Map all third-party API endpoints',
      description: 'Document all external APIs being used and their authentication methods.',
      status:      'Done',
      priority:    'High',
      project:     api._id,
      assignedTo:  manav._id,
      createdBy:   kaushal._id,
      dueDate:     new Date(now.getTime() - 7 * day),
      completedAt: new Date(now.getTime() - 5 * day),
      tags:        ['documentation', 'api'],
      order:       1
    },
    {
      title:       'Build middleware for API rate limiting',
      description: 'Implement rate limiting middleware to prevent API abuse.',
      status:      'Review',
      priority:    'High',
      project:     api._id,
      assignedTo:  shreya._id,
      createdBy:   drashti._id,
      dueDate:     new Date(now.getTime() + 1 * day),
      tags:        ['middleware', 'security'],
      order:       1
    },
    {
      title:       'Implement caching layer with Redis',
      description: 'Add Redis caching for frequently accessed API responses.',
      status:      'In Progress',
      priority:    'Medium',
      project:     api._id,
      assignedTo:  kaushal._id,
      createdBy:   manav._id,
      dueDate:     new Date(now.getTime() + 5 * day),
      tags:        ['redis', 'caching', 'performance'],
      order:       1
    },

    // ── Analytics Dashboard Tasks ─────────────────────────────────────────────
    {
      title:       'Define KPI metrics with stakeholders',
      description: 'Meet with business team to finalize which metrics to display.',
      status:      'Done',
      priority:    'Medium',
      project:     analytics._id,
      assignedTo:  manav._id,
      createdBy:   shreya._id,
      dueDate:     new Date(now.getTime() - 10 * day),
      completedAt: new Date(now.getTime() - 8 * day),
      tags:        ['planning', 'kpi'],
      order:       1
    },
    {
      title:       'Research charting libraries',
      description: 'Evaluate Recharts, Chart.js and D3.js for dashboard use case.',
      status:      'Backlog',
      priority:    'Low',
      project:     analytics._id,
      assignedTo:  hiya._id,
      createdBy:   drashti._id,
      dueDate:     new Date(now.getTime() + 20 * day),
      tags:        ['research', 'charts'],
      order:       1
    }
  ]);

  console.log(`✅ ${tasks.length} Tasks seeded`);
  return tasks;
};

// ─── Seed Comments ────────────────────────────────────────────────────────────
const seedComments = async (users, tasks) => {
  const [kaushal, shreya, drashti, hiya, manav] = users;

  const comments = await Comment.insertMany([
    {
      content:  'Homepage mockup looks great! Just need to adjust the hero section spacing.',
      task:     tasks[0]._id,
      project:  tasks[0].project,
      author:   kaushal._id
    },
    {
      content:  'Thanks! I will update the spacing and share the revised version by EOD.',
      task:     tasks[0]._id,
      project:  tasks[0].project,
      author:   shreya._id
    },
    {
      content:  'React project structure is clean. Good use of feature-based folder organization.',
      task:     tasks[1]._id,
      project:  tasks[1].project,
      author:   drashti._id
    },
    {
      content:  'Should we use Zustand or Context API for state management in this project?',
      task:     tasks[2]._id,
      project:  tasks[2].project,
      author:   hiya._id
    },
    {
      content:  'Let us go with Zustand — it is simpler and performs better for this use case.',
      task:     tasks[2]._id,
      project:  tasks[2].project,
      author:   manav._id
    },
    {
      content:  'Cart functionality needs to handle edge cases for out-of-stock items.',
      task:     tasks[3]._id,
      project:  tasks[3].project,
      author:   hiya._id
    },
    {
      content:  'Razorpay sandbox credentials are ready. I will share them in the team channel.',
      task:     tasks[4]._id,
      project:  tasks[4].project,
      author:   kaushal._id
    },
    {
      content:  'Navigation flow approved. Proceeding with implementation.',
      task:     tasks[8]._id,
      project:  tasks[8].project,
      author:   drashti._id
    },
    {
      content:  'Rate limiting middleware is working correctly in staging. Ready for review.',
      task:     tasks[15]._id,
      project:  tasks[15].project,
      author:   shreya._id
    },
    {
      content:  'Reviewed. Looks solid. One suggestion — add exponential backoff for retries.',
      task:     tasks[15]._id,
      project:  tasks[15].project,
      author:   kaushal._id
    }
  ]);

  console.log(`💬 ${comments.length} Comments seeded`);
  return comments;
};

// ─── Seed Notifications ───────────────────────────────────────────────────────
const seedNotifications = async (users, projects, tasks) => {
  const [kaushal, shreya, drashti, hiya, manav] = users;
  const [ecommerce, mobile, hr, api] = projects;

  const notifications = await Notification.insertMany([
    {
      recipient:  kaushal._id,
      sender:     shreya._id,
      type:       'task_assigned',
      message:    'Shreya Lad assigned you: "Payment gateway integration"',
      link:       `/projects/${ecommerce._id}`,
      isRead:     false,
      refProject: ecommerce._id,
      refTask:    tasks[4]._id
    },
    {
      recipient:  drashti._id,
      sender:     hiya._id,
      type:       'comment_added',
      message:    'Hiya Modi commented on "Build product listing page"',
      link:       `/projects/${ecommerce._id}`,
      isRead:     false,
      refProject: ecommerce._id,
      refTask:    tasks[2]._id
    },
    {
      recipient:  shreya._id,
      sender:     drashti._id,
      type:       'task_completed',
      message:    'Drashti Savaliya completed "Setup React Native environment"',
      link:       `/projects/${mobile._id}`,
      isRead:     true,
      readAt:     new Date(),
      refProject: mobile._id,
      refTask:    tasks[7]._id
    },
    {
      recipient:  manav._id,
      sender:     kaushal._id,
      type:       'project_created',
      message:    'Kaushal Patel added you to "Mobile App Development"',
      link:       `/projects/${mobile._id}`,
      isRead:     false,
      refProject: mobile._id
    },
    {
      recipient:  shreya._id,
      sender:     kaushal._id,
      type:       'task_assigned',
      message:    'Kaushal Patel assigned you: "Build authentication screens"',
      link:       `/projects/${mobile._id}`,
      isRead:     false,
      refProject: mobile._id,
      refTask:    tasks[9]._id
    },
    {
      recipient:  drashti._id,
      sender:     kaushal._id,
      type:       'task_assigned',
      message:    'Kaushal Patel assigned you: "Design database schema for employees"',
      link:       `/projects/${hr._id}`,
      isRead:     false,
      refProject: hr._id,
      refTask:    tasks[12]._id
    },
    {
      recipient:  hiya._id,
      sender:     manav._id,
      type:       'comment_added',
      message:    'Manav Surti commented on "Build middleware for API rate limiting"',
      link:       `/projects/${api._id}`,
      isRead:     false,
      refProject: api._id,
      refTask:    tasks[15]._id
    },
    {
      recipient:  kaushal._id,
      sender:     manav._id,
      type:       'deadline_reminder',
      message:    'Deadline approaching: "Code review for cart module" is due tomorrow',
      link:       `/projects/${ecommerce._id}`,
      isRead:     false,
      refProject: ecommerce._id,
      refTask:    tasks[6]._id
    }
  ]);

  console.log(`🔔 ${notifications.length} Notifications seeded`);
  return notifications;
};

//Main Seed function
const seedDatabase = async () => {
    await connectDB();
    await clearDB();

    console.log('\n🌱 Starting seed...\n');

    const users = await seedUser();
    const projects = await seedProjects(users);
    const tasks = await seedTasks(users, projects);
    const comments = await seedComments(users, tasks);
    const notifications = await seedNotifications(users, projects, tasks);

    console.log('\n✅ Database seeded successfully!\n');
  console.log('─────────────────────────────────────');
  console.log(`👥 Users:         ${users.length}`);
  console.log(`📁 Projects:      ${projects.length}`);
  console.log(`✅ Tasks:         ${tasks.length}`);
  console.log(`💬 Comments:      ${comments.length}`);
  console.log(`🔔 Notifications: ${notifications.length}`);

  process.exit(0);
}

seedDatabase();