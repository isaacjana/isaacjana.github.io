/**
 * SysX — Wireframe Templates Library
 * Pre-built wireframe layouts that users can select and customize.
 */

const SysXWireframes = [
    // ==========================================
    // LANDING PAGES
    // ==========================================
    {
        id: 'landing-hero',
        name: 'Hero Landing Page',
        description: 'Modern hero section with CTA, features grid, and footer',
        category: 'landing',
        tags: ['hero', 'cta', 'features'],
        components: [
            {
                type: 'navbar',
                props: { brand: 'SaaSify', links: 'Features\nPricing\nAbout\nBlog' },
                styles: {}
            },
            {
                type: 'section',
                styles: { padding: '80px 32px', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                children: [
                    {
                        type: 'heading',
                        props: { text: 'Build Something Amazing', level: 'h1' },
                        styles: { color: '#ffffff', fontSize: '48px', fontWeight: '800', marginBottom: '16px', textAlign: 'center' }
                    },
                    {
                        type: 'paragraph',
                        props: { text: 'The all-in-one platform for teams who want to ship faster. Start building today with our powerful tools.' },
                        styles: { color: 'rgba(255,255,255,0.85)', fontSize: '18px', maxWidth: '600px', margin: '0 auto 32px', textAlign: 'center' }
                    },
                    {
                        type: 'row',
                        styles: { justifyContent: 'center', gap: '12px', display: 'flex' },
                        children: [
                            {
                                type: 'button',
                                props: { text: 'Get Started Free', variant: 'primary' },
                                styles: { backgroundColor: '#ffffff', color: '#667eea', padding: '14px 32px', fontSize: '16px', fontWeight: '600', borderRadius: '10px' }
                            },
                            {
                                type: 'button',
                                props: { text: 'Watch Demo', variant: 'outline' },
                                styles: { backgroundColor: 'transparent', color: '#ffffff', border: '2px solid rgba(255,255,255,0.5)', padding: '14px 32px', fontSize: '16px', borderRadius: '10px' }
                            }
                        ]
                    }
                ]
            },
            {
                type: 'section',
                styles: { padding: '64px 32px' },
                children: [
                    {
                        type: 'heading',
                        props: { text: 'Why Teams Choose Us', level: 'h2' },
                        styles: { textAlign: 'center', marginBottom: '48px', fontSize: '32px' }
                    },
                    {
                        type: 'row',
                        styles: { display: 'flex', gap: '24px' },
                        children: [
                            { type: 'card', props: { title: '⚡ Lightning Fast', description: 'Deploy in seconds with our optimized pipeline. No more waiting.' }, styles: { flex: '1' } },
                            { type: 'card', props: { title: '🔒 Secure by Default', description: 'Enterprise-grade security built into every layer of the stack.' }, styles: { flex: '1' } },
                            { type: 'card', props: { title: '📊 Real-time Analytics', description: 'Monitor everything with powerful dashboards and alerts.' }, styles: { flex: '1' } }
                        ]
                    }
                ]
            }
        ]
    },

    {
        id: 'landing-startup',
        name: 'Startup Landing',
        description: 'Clean startup landing page with hero, social proof, and features',
        category: 'landing',
        tags: ['startup', 'minimal', 'modern'],
        components: [
            {
                type: 'navbar',
                props: { brand: 'Launchpad', links: 'Product\nSolutions\nPricing\nDocs' },
                styles: {}
            },
            {
                type: 'section',
                styles: { padding: '100px 32px', textAlign: 'center', backgroundColor: '#fafafa' },
                children: [
                    {
                        type: 'badge',
                        props: { text: '🚀 Now in Public Beta', variant: 'primary' },
                        styles: { marginBottom: '24px', display: 'inline-block' }
                    },
                    {
                        type: 'heading',
                        props: { text: 'The Future of Team Collaboration', level: 'h1' },
                        styles: { fontSize: '52px', fontWeight: '800', marginBottom: '20px', maxWidth: '700px', margin: '0 auto 20px' }
                    },
                    {
                        type: 'paragraph',
                        props: { text: 'Connect, collaborate, and create together in real-time. Built for modern teams that move fast.' },
                        styles: { fontSize: '18px', color: '#6b7280', maxWidth: '550px', margin: '0 auto 40px' }
                    },
                    {
                        type: 'input',
                        props: { label: '', placeholder: 'Enter your email to get started' },
                        styles: { maxWidth: '400px', margin: '0 auto 12px' }
                    },
                    {
                        type: 'button',
                        props: { text: 'Start Free Trial →', variant: 'primary' },
                        styles: { padding: '14px 40px', fontSize: '16px', borderRadius: '10px' }
                    }
                ]
            },
            {
                type: 'section',
                styles: { padding: '48px 32px', textAlign: 'center' },
                children: [
                    {
                        type: 'paragraph',
                        props: { text: 'Trusted by 10,000+ teams worldwide' },
                        styles: { fontSize: '13px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '24px' }
                    },
                    {
                        type: 'row',
                        styles: { display: 'flex', justifyContent: 'center', gap: '48px', opacity: '0.4' },
                        children: [
                            { type: 'heading', props: { text: 'Google', level: 'h4' }, styles: { fontSize: '20px', color: '#9ca3af' } },
                            { type: 'heading', props: { text: 'Microsoft', level: 'h4' }, styles: { fontSize: '20px', color: '#9ca3af' } },
                            { type: 'heading', props: { text: 'Stripe', level: 'h4' }, styles: { fontSize: '20px', color: '#9ca3af' } },
                            { type: 'heading', props: { text: 'Notion', level: 'h4' }, styles: { fontSize: '20px', color: '#9ca3af' } },
                            { type: 'heading', props: { text: 'Figma', level: 'h4' }, styles: { fontSize: '20px', color: '#9ca3af' } }
                        ]
                    }
                ]
            }
        ]
    },

    // ==========================================
    // DASHBOARDS
    // ==========================================
    {
        id: 'dashboard-analytics',
        name: 'Analytics Dashboard',
        description: 'Data-rich dashboard with sidebar, stats cards, and charts',
        category: 'dashboard',
        tags: ['analytics', 'charts', 'stats'],
        components: [
            {
                type: 'row',
                styles: { display: 'flex', gap: '0', minHeight: '700px' },
                children: [
                    {
                        type: 'sidebar-nav',
                        props: { links: '📊 Dashboard\n📈 Analytics\n👥 Users\n📁 Projects\n💬 Messages\n⚙️ Settings' },
                        styles: { width: '220px', minHeight: '700px' }
                    },
                    {
                        type: 'section',
                        styles: { flex: '1', padding: '24px', backgroundColor: '#f3f4f6' },
                        children: [
                            {
                                type: 'heading',
                                props: { text: 'Dashboard Overview', level: 'h2' },
                                styles: { fontSize: '24px', marginBottom: '24px' }
                            },
                            {
                                type: 'row',
                                styles: { display: 'flex', gap: '16px', marginBottom: '24px' },
                                children: [
                                    { type: 'card', props: { title: '📈 Revenue', description: '$48,290 (+12.5%)' }, styles: { flex: '1', padding: '20px' } },
                                    { type: 'card', props: { title: '👥 Users', description: '2,450 (+8.3%)' }, styles: { flex: '1', padding: '20px' } },
                                    { type: 'card', props: { title: '📊 Conversions', description: '1,230 (+15.2%)' }, styles: { flex: '1', padding: '20px' } },
                                    { type: 'card', props: { title: '⏱️ Avg. Time', description: '4m 32s (-2.1%)' }, styles: { flex: '1', padding: '20px' } }
                                ]
                            },
                            {
                                type: 'row',
                                styles: { display: 'flex', gap: '16px' },
                                children: [
                                    { type: 'chart', props: { chartType: 'bar' }, styles: { flex: '2' } },
                                    { type: 'table', props: { columns: 'User,Action,Time' }, styles: { flex: '1' } }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    {
        id: 'dashboard-project',
        name: 'Project Dashboard',
        description: 'Project management dashboard with task overview and team section',
        category: 'dashboard',
        tags: ['project', 'tasks', 'team'],
        components: [
            {
                type: 'navbar',
                props: { brand: '📋 ProjectX', links: 'Board\nTimeline\nCalendar\nReports' },
                styles: {}
            },
            {
                type: 'section',
                styles: { padding: '24px', backgroundColor: '#f9fafb' },
                children: [
                    {
                        type: 'row',
                        styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
                        children: [
                            { type: 'heading', props: { text: 'Sprint Board', level: 'h2' }, styles: { fontSize: '24px' } },
                            { type: 'button', props: { text: '+ New Task', variant: 'primary' }, styles: {} }
                        ]
                    },
                    {
                        type: 'row',
                        styles: { display: 'flex', gap: '16px' },
                        children: [
                            {
                                type: 'container',
                                styles: { flex: '1', backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '16px' },
                                children: [
                                    { type: 'heading', props: { text: '📋 To Do (4)', level: 'h4' }, styles: { fontSize: '14px', marginBottom: '12px' } },
                                    { type: 'card', props: { title: 'Design System Update', description: 'Update color tokens and typography' }, styles: { marginBottom: '8px', padding: '12px' } },
                                    { type: 'card', props: { title: 'API Integration', description: 'Connect payment gateway' }, styles: { padding: '12px' } }
                                ]
                            },
                            {
                                type: 'container',
                                styles: { flex: '1', backgroundColor: '#eff6ff', borderRadius: '12px', padding: '16px' },
                                children: [
                                    { type: 'heading', props: { text: '🔄 In Progress (3)', level: 'h4' }, styles: { fontSize: '14px', marginBottom: '12px' } },
                                    { type: 'card', props: { title: 'User Dashboard', description: 'Building analytics components' }, styles: { marginBottom: '8px', padding: '12px' } },
                                    { type: 'card', props: { title: 'Mobile Responsive', description: 'Fix tablet breakpoints' }, styles: { padding: '12px' } }
                                ]
                            },
                            {
                                type: 'container',
                                styles: { flex: '1', backgroundColor: '#ecfdf5', borderRadius: '12px', padding: '16px' },
                                children: [
                                    { type: 'heading', props: { text: '✅ Done (7)', level: 'h4' }, styles: { fontSize: '14px', marginBottom: '12px' } },
                                    { type: 'card', props: { title: 'Auth System', description: 'Login & registration complete' }, styles: { marginBottom: '8px', padding: '12px' } },
                                    { type: 'card', props: { title: 'Database Schema', description: 'All tables migrated' }, styles: { padding: '12px' } }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    // ==========================================
    // E-COMMERCE
    // ==========================================
    {
        id: 'ecommerce-product',
        name: 'Product Page',
        description: 'E-commerce product page with gallery, details, and reviews',
        category: 'ecommerce',
        tags: ['product', 'shop', 'detail'],
        components: [
            {
                type: 'navbar',
                props: { brand: '🛒 ShopHub', links: 'Categories\nDeals\nNew Arrivals\nCart' },
                styles: {}
            },
            {
                type: 'breadcrumb',
                props: { items: 'Home\nElectronics\nHeadphones\nPro X1' },
                styles: { padding: '16px 32px' }
            },
            {
                type: 'section',
                styles: { padding: '0 32px 48px' },
                children: [
                    {
                        type: 'row',
                        styles: { display: 'flex', gap: '48px' },
                        children: [
                            {
                                type: 'image',
                                props: { src: 'https://placehold.co/500x500/f3f4f6/9ca3af?text=Product+Image', alt: 'Product' },
                                styles: { flex: '1', borderRadius: '16px' }
                            },
                            {
                                type: 'container',
                                styles: { flex: '1', padding: '0' },
                                children: [
                                    { type: 'badge', props: { text: 'NEW', variant: 'primary' }, styles: { marginBottom: '12px' } },
                                    { type: 'heading', props: { text: 'Pro X1 Wireless Headphones', level: 'h1' }, styles: { fontSize: '32px', marginBottom: '8px' } },
                                    { type: 'heading', props: { text: '$299.99', level: 'h3' }, styles: { fontSize: '28px', color: '#6366f1', marginBottom: '16px' } },
                                    { type: 'paragraph', props: { text: 'Premium wireless noise-cancelling headphones with 40-hour battery life, spatial audio, and adaptive EQ. Perfect for music lovers and professionals.' }, styles: { marginBottom: '24px' } },
                                    { type: 'divider', props: {}, styles: { marginBottom: '24px' } },
                                    { type: 'select', props: { label: 'Color', options: 'Midnight Black\nSilver\nNavy Blue' }, styles: { marginBottom: '16px' } },
                                    {
                                        type: 'row', styles: { display: 'flex', gap: '12px' }, children: [
                                            { type: 'button', props: { text: '🛒 Add to Cart', variant: 'primary' }, styles: { flex: '1', padding: '14px', fontSize: '16px' } },
                                            { type: 'button', props: { text: '♥', variant: 'outline' }, styles: { padding: '14px 18px' } }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    {
        id: 'ecommerce-catalog',
        name: 'Product Catalog',
        description: 'Product grid with filters and sorting',
        category: 'ecommerce',
        tags: ['catalog', 'grid', 'filters'],
        components: [
            {
                type: 'navbar',
                props: { brand: '🛍️ StyleStore', links: 'Women\nMen\nKids\nSale' },
                styles: {}
            },
            {
                type: 'section',
                styles: { padding: '24px 32px', backgroundColor: '#f9fafb' },
                children: [
                    {
                        type: 'row',
                        styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
                        children: [
                            { type: 'heading', props: { text: 'All Products', level: 'h2' }, styles: { fontSize: '28px' } },
                            { type: 'select', props: { label: '', options: 'Sort by: Featured\nPrice: Low to High\nPrice: High to Low\nNewest' }, styles: { width: '200px' } }
                        ]
                    },
                    {
                        type: 'row',
                        styles: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
                        children: [
                            { type: 'card', props: { title: '👕 Classic T-Shirt', description: '$29.99' }, styles: { flex: '0 0 calc(25% - 12px)', padding: '16px' } },
                            { type: 'card', props: { title: '👖 Slim Jeans', description: '$59.99' }, styles: { flex: '0 0 calc(25% - 12px)', padding: '16px' } },
                            { type: 'card', props: { title: '👟 Running Shoes', description: '$89.99' }, styles: { flex: '0 0 calc(25% - 12px)', padding: '16px' } },
                            { type: 'card', props: { title: '🧥 Winter Jacket', description: '$149.99' }, styles: { flex: '0 0 calc(25% - 12px)', padding: '16px' } }
                        ]
                    },
                    { type: 'pagination', props: { pages: '5' }, styles: { marginTop: '32px', display: 'flex', justifyContent: 'center' } }
                ]
            }
        ]
    },

    // ==========================================
    // BLOG / CONTENT
    // ==========================================
    {
        id: 'blog-home',
        name: 'Blog Homepage',
        description: 'Blog layout with featured post, grid, and sidebar',
        category: 'blog',
        tags: ['blog', 'articles', 'content'],
        components: [
            {
                type: 'navbar',
                props: { brand: '📝 TechBlog', links: 'Articles\nTutorials\nNews\nAbout' },
                styles: {}
            },
            {
                type: 'section',
                styles: { padding: '48px 32px' },
                children: [
                    {
                        type: 'heading',
                        props: { text: 'Latest Articles', level: 'h1' },
                        styles: { fontSize: '36px', textAlign: 'center', marginBottom: '8px' }
                    },
                    {
                        type: 'paragraph',
                        props: { text: 'Stay up to date with the latest in technology and development' },
                        styles: { textAlign: 'center', color: '#6b7280', marginBottom: '48px' }
                    },
                    {
                        type: 'row',
                        styles: { display: 'flex', gap: '24px' },
                        children: [
                            { type: 'card', props: { title: '🤖 The Rise of AI in 2025', description: 'How artificial intelligence is reshaping every industry and what developers need to know about the latest trends.' }, styles: { flex: '1' } },
                            { type: 'card', props: { title: '⚛️ React vs Vue in 2025', description: 'A comprehensive comparison of the two most popular frontend frameworks and when to use each one.' }, styles: { flex: '1' } },
                            { type: 'card', props: { title: '🚀 Serverless Architecture', description: 'Building scalable applications without managing servers — a practical guide for modern developers.' }, styles: { flex: '1' } }
                        ]
                    }
                ]
            }
        ]
    },

    // ==========================================
    // AUTH / FORMS
    // ==========================================
    {
        id: 'auth-login',
        name: 'Login Page',
        description: 'Clean login form with social auth options',
        category: 'auth',
        tags: ['login', 'auth', 'form'],
        components: [
            {
                type: 'section',
                styles: { minHeight: '700px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '48px' },
                children: [
                    {
                        type: 'container',
                        styles: { maxWidth: '400px', width: '100%', padding: '40px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
                        children: [
                            { type: 'heading', props: { text: '👋 Welcome back', level: 'h2' }, styles: { textAlign: 'center', marginBottom: '8px', fontSize: '24px' } },
                            { type: 'paragraph', props: { text: 'Sign in to your account to continue' }, styles: { textAlign: 'center', marginBottom: '32px', color: '#6b7280' } },
                            { type: 'input', props: { label: 'Email', placeholder: 'you@example.com', inputType: 'email' }, styles: { marginBottom: '16px' } },
                            { type: 'input', props: { label: 'Password', placeholder: '••••••••', inputType: 'password' }, styles: { marginBottom: '8px' } },
                            {
                                type: 'row', styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }, children: [
                                    { type: 'checkbox', props: { label: 'Remember me' }, styles: {} },
                                    { type: 'link', props: { text: 'Forgot password?', href: '#' }, styles: { fontSize: '13px' } }
                                ]
                            },
                            { type: 'button', props: { text: 'Sign In', variant: 'primary' }, styles: { width: '100%', padding: '12px', fontSize: '15px', textAlign: 'center' } },
                            { type: 'divider', props: {}, styles: { margin: '24px 0' } },
                            { type: 'paragraph', props: { text: 'Don\'t have an account? Sign up' }, styles: { textAlign: 'center', fontSize: '13px', color: '#6b7280' } }
                        ]
                    }
                ]
            }
        ]
    },

    {
        id: 'auth-signup',
        name: 'Sign Up Page',
        description: 'Registration form with split layout',
        category: 'auth',
        tags: ['signup', 'register', 'form'],
        components: [
            {
                type: 'row',
                styles: { display: 'flex', minHeight: '700px' },
                children: [
                    {
                        type: 'section',
                        styles: { flex: '1', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' },
                        children: [
                            { type: 'heading', props: { text: '🚀 Start Your Journey', level: 'h1' }, styles: { color: 'white', fontSize: '40px', marginBottom: '16px' } },
                            { type: 'paragraph', props: { text: 'Join thousands of creators building amazing things with our platform.' }, styles: { color: 'rgba(255,255,255,0.8)', fontSize: '18px', maxWidth: '400px' } }
                        ]
                    },
                    {
                        type: 'section',
                        styles: { flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' },
                        children: [
                            {
                                type: 'container',
                                styles: { maxWidth: '400px', width: '100%', padding: '0' },
                                children: [
                                    { type: 'heading', props: { text: 'Create Account', level: 'h2' }, styles: { marginBottom: '32px', fontSize: '28px' } },
                                    {
                                        type: 'row', styles: { display: 'flex', gap: '12px', marginBottom: '16px' }, children: [
                                            { type: 'input', props: { label: 'First Name', placeholder: 'John' }, styles: { flex: '1' } },
                                            { type: 'input', props: { label: 'Last Name', placeholder: 'Doe' }, styles: { flex: '1' } }
                                        ]
                                    },
                                    { type: 'input', props: { label: 'Email', placeholder: 'you@example.com', inputType: 'email' }, styles: { marginBottom: '16px' } },
                                    { type: 'input', props: { label: 'Password', placeholder: 'Create a strong password', inputType: 'password' }, styles: { marginBottom: '16px' } },
                                    { type: 'checkbox', props: { label: 'I agree to the Terms and Privacy Policy' }, styles: { marginBottom: '24px' } },
                                    { type: 'button', props: { text: 'Create Account', variant: 'primary' }, styles: { width: '100%', padding: '12px', fontSize: '15px' } }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    // ==========================================
    // PORTFOLIO
    // ==========================================
    {
        id: 'portfolio-creative',
        name: 'Creative Portfolio',
        description: 'Portfolio with hero, projects grid, and contact section',
        category: 'portfolio',
        tags: ['portfolio', 'creative', 'projects'],
        components: [
            {
                type: 'navbar',
                props: { brand: 'Jane.dev', links: 'Work\nAbout\nBlog\nContact' },
                styles: {}
            },
            {
                type: 'section',
                styles: { padding: '80px 32px', textAlign: 'center', backgroundColor: '#111827' },
                children: [
                    { type: 'avatar', props: { initials: 'JD', size: '80px', bgColor: '#6366f1' }, styles: { margin: '0 auto 24px', display: 'flex', justifyContent: 'center' } },
                    { type: 'heading', props: { text: 'Hi, I\'m Jane 👋', level: 'h1' }, styles: { color: 'white', fontSize: '48px', marginBottom: '16px' } },
                    { type: 'paragraph', props: { text: 'Full-stack developer & designer crafting beautiful digital experiences' }, styles: { color: '#9ca3af', fontSize: '18px', marginBottom: '32px' } },
                    {
                        type: 'row', styles: { display: 'flex', justifyContent: 'center', gap: '16px' }, children: [
                            { type: 'button', props: { text: 'View Work', variant: 'primary' }, styles: { padding: '12px 32px' } },
                            { type: 'button', props: { text: 'Get in Touch', variant: 'outline' }, styles: { padding: '12px 32px', color: 'white', borderColor: 'rgba(255,255,255,0.3)' } }
                        ]
                    }
                ]
            },
            {
                type: 'section',
                styles: { padding: '64px 32px' },
                children: [
                    { type: 'heading', props: { text: 'Selected Work', level: 'h2' }, styles: { fontSize: '32px', marginBottom: '32px' } },
                    {
                        type: 'row',
                        styles: { display: 'flex', gap: '24px' },
                        children: [
                            { type: 'card', props: { title: 'E-Commerce Platform', description: 'A modern shopping experience built with React and Node.js' }, styles: { flex: '1' } },
                            { type: 'card', props: { title: 'SaaS Dashboard', description: 'Analytics dashboard for a growing startup' }, styles: { flex: '1' } },
                            { type: 'card', props: { title: 'Mobile App', description: 'Cross-platform fitness tracking application' }, styles: { flex: '1' } }
                        ]
                    }
                ]
            }
        ]
    },

    // ==========================================
    // SAAS
    // ==========================================
    {
        id: 'saas-pricing',
        name: 'SaaS Pricing Page',
        description: 'Pricing table with feature comparison and FAQ',
        category: 'saas',
        tags: ['pricing', 'plans', 'saas'],
        components: [
            {
                type: 'navbar',
                props: { brand: '💎 CloudApp', links: 'Features\nPricing\nDocs\nBlog' },
                styles: {}
            },
            {
                type: 'section',
                styles: { padding: '64px 32px', textAlign: 'center' },
                children: [
                    { type: 'heading', props: { text: 'Simple, Transparent Pricing', level: 'h1' }, styles: { fontSize: '40px', marginBottom: '12px' } },
                    { type: 'paragraph', props: { text: 'Start free. Upgrade when you need more power.' }, styles: { fontSize: '18px', color: '#6b7280', marginBottom: '48px' } },
                    {
                        type: 'row',
                        styles: { display: 'flex', gap: '24px', maxWidth: '900px', margin: '0 auto' },
                        children: [
                            {
                                type: 'container',
                                styles: { flex: '1', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '32px', textAlign: 'center' },
                                children: [
                                    { type: 'heading', props: { text: 'Starter', level: 'h3' }, styles: { marginBottom: '8px' } },
                                    { type: 'heading', props: { text: '$0/mo', level: 'h2' }, styles: { fontSize: '36px', marginBottom: '24px' } },
                                    { type: 'list', props: { items: '✓ 3 Projects\n✓ 1GB Storage\n✓ Basic Analytics\n✗ Priority Support' }, styles: { textAlign: 'left', marginBottom: '24px' } },
                                    { type: 'button', props: { text: 'Get Started', variant: 'secondary' }, styles: { width: '100%' } }
                                ]
                            },
                            {
                                type: 'container',
                                styles: { flex: '1', border: '2px solid #6366f1', borderRadius: '16px', padding: '32px', textAlign: 'center', position: 'relative', boxShadow: '0 8px 32px rgba(99,102,241,0.15)' },
                                children: [
                                    { type: 'badge', props: { text: 'POPULAR', variant: 'primary' }, styles: { marginBottom: '16px' } },
                                    { type: 'heading', props: { text: 'Pro', level: 'h3' }, styles: { marginBottom: '8px' } },
                                    { type: 'heading', props: { text: '$29/mo', level: 'h2' }, styles: { fontSize: '36px', marginBottom: '24px', color: '#6366f1' } },
                                    { type: 'list', props: { items: '✓ Unlimited Projects\n✓ 50GB Storage\n✓ Advanced Analytics\n✓ Priority Support' }, styles: { textAlign: 'left', marginBottom: '24px' } },
                                    { type: 'button', props: { text: 'Start Free Trial', variant: 'primary' }, styles: { width: '100%' } }
                                ]
                            },
                            {
                                type: 'container',
                                styles: { flex: '1', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '32px', textAlign: 'center' },
                                children: [
                                    { type: 'heading', props: { text: 'Enterprise', level: 'h3' }, styles: { marginBottom: '8px' } },
                                    { type: 'heading', props: { text: 'Custom', level: 'h2' }, styles: { fontSize: '36px', marginBottom: '24px' } },
                                    { type: 'list', props: { items: '✓ Everything in Pro\n✓ Unlimited Storage\n✓ SSO & SAML\n✓ Dedicated Support' }, styles: { textAlign: 'left', marginBottom: '24px' } },
                                    { type: 'button', props: { text: 'Contact Sales', variant: 'outline' }, styles: { width: '100%' } }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    // ==========================================
    // MOBILE
    // ==========================================
    {
        id: 'mobile-app',
        name: 'Mobile App Screen',
        description: 'Mobile app layout with bottom navigation and feed',
        category: 'mobile',
        tags: ['mobile', 'app', 'feed'],
        components: [
            {
                type: 'container',
                styles: { maxWidth: '375px', margin: '0 auto', border: '1px solid #e5e7eb', borderRadius: '24px', overflow: 'hidden', backgroundColor: '#ffffff', minHeight: '700px', position: 'relative' },
                children: [
                    {
                        type: 'row',
                        styles: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #f3f4f6' },
                        children: [
                            { type: 'avatar', props: { initials: 'JD', size: '36px' }, styles: {} },
                            { type: 'heading', props: { text: 'Feed', level: 'h3' }, styles: { fontSize: '18px' } },
                            { type: 'icon', props: { emoji: '🔔', size: '20px' }, styles: {} }
                        ]
                    },
                    {
                        type: 'container',
                        styles: { padding: '16px' },
                        children: [
                            { type: 'card', props: { title: '📱 New Feature Released', description: 'Check out the latest update with amazing new tools for your workflow.' }, styles: { marginBottom: '12px', padding: '16px' } },
                            { type: 'card', props: { title: '🎉 Achievement Unlocked', description: 'You\'ve completed 30 days of consistent usage!' }, styles: { marginBottom: '12px', padding: '16px' } },
                            { type: 'card', props: { title: '💡 Tip of the Day', description: 'Use keyboard shortcuts to boost your productivity by 2x.' }, styles: { padding: '16px' } }
                        ]
                    },
                    {
                        type: 'row',
                        styles: { display: 'flex', justifyContent: 'space-around', padding: '12px', borderTop: '1px solid #f3f4f6', backgroundColor: 'white', position: 'absolute', bottom: '0', left: '0', right: '0' },
                        children: [
                            { type: 'icon', props: { emoji: '🏠', size: '24px' }, styles: {} },
                            { type: 'icon', props: { emoji: '🔍', size: '24px' }, styles: {} },
                            { type: 'icon', props: { emoji: '➕', size: '24px' }, styles: {} },
                            { type: 'icon', props: { emoji: '💬', size: '24px' }, styles: {} },
                            { type: 'icon', props: { emoji: '👤', size: '24px' }, styles: {} }
                        ]
                    }
                ]
            }
        ]
    },

    {
        id: 'mobile-settings',
        name: 'Mobile Settings',
        description: 'Mobile settings/profile screen',
        category: 'mobile',
        tags: ['mobile', 'settings', 'profile'],
        components: [
            {
                type: 'container',
                styles: { maxWidth: '375px', margin: '0 auto', border: '1px solid #e5e7eb', borderRadius: '24px', overflow: 'hidden', backgroundColor: '#f9fafb', minHeight: '700px' },
                children: [
                    {
                        type: 'section',
                        styles: { padding: '32px 16px', textAlign: 'center', backgroundColor: 'white', borderBottom: '1px solid #f3f4f6' },
                        children: [
                            { type: 'avatar', props: { initials: 'JD', size: '64px', bgColor: '#6366f1' }, styles: { margin: '0 auto 12px', display: 'flex', justifyContent: 'center' } },
                            { type: 'heading', props: { text: 'John Doe', level: 'h3' }, styles: { fontSize: '18px', marginBottom: '4px' } },
                            { type: 'paragraph', props: { text: 'john@example.com' }, styles: { fontSize: '13px', color: '#6b7280' } }
                        ]
                    },
                    {
                        type: 'container',
                        styles: { padding: '16px' },
                        children: [
                            { type: 'heading', props: { text: 'Settings', level: 'h4' }, styles: { fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '4px' } },
                            { type: 'toggle', props: { label: 'Dark Mode' }, styles: { padding: '12px', backgroundColor: 'white', borderRadius: '10px', marginBottom: '4px' } },
                            { type: 'toggle', props: { label: 'Push Notifications' }, styles: { padding: '12px', backgroundColor: 'white', borderRadius: '10px', marginBottom: '4px' } },
                            { type: 'toggle', props: { label: 'Auto-save' }, styles: { padding: '12px', backgroundColor: 'white', borderRadius: '10px', marginBottom: '16px' } },
                            { type: 'button', props: { text: 'Log Out', variant: 'danger' }, styles: { width: '100%', padding: '12px' } }
                        ]
                    }
                ]
            }
        ]
    }
];
