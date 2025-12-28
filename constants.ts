import { Persona, ThoughtNode } from "./types";

export const THINKERS: Persona[] = [
  { 
    id: "jobs", 
    name: "Steve Jobs", 
    role: "The Visionary", 
    avatar: "", 
    color: "text-zinc-300", 
    gradient: "from-zinc-400 to-zinc-600",
    description: "Direct. Brutal. Obsessed with simplicity." 
  },
  { 
    id: "feynman", 
    name: "Richard Feynman", 
    role: "The Explainer", 
    avatar: "⚛️", 
    color: "text-violet-300", 
    gradient: "from-violet-300 to-fuchsia-400",
    description: "Playful, curious. Nature is the ultimate truth." 
  },
  { 
    id: "jung", 
    name: "Carl Jung", 
    role: "The Analyst", 
    avatar: "🔮", 
    color: "text-indigo-300", 
    gradient: "from-indigo-400 to-purple-600",
    description: "Look into the shadow. Integrate the unconscious." 
  },
  { 
    id: "kahlo", 
    name: "Frida Kahlo", 
    role: "The Artist", 
    avatar: "🌺", 
    color: "text-rose-300", 
    gradient: "from-rose-300 to-pink-500",
    description: "Raw, emotional, surreal." 
  },
  { 
    id: "musk", 
    name: "Elon Musk", 
    role: "The Engineer", 
    avatar: "🚀", 
    color: "text-sky-300", 
    gradient: "from-sky-300 to-cyan-500",
    description: "First principles thinker." 
  }
];

// --- MINDFULNESS PALETTE ---
export const getRandomMindfulColor = () => {
    // A single unified palette for organic thoughts (Starlight / Ethereal)
    // We vary opacity and slight hue, but keep it cohesive.
    const PALETTE = ["#e2e8f0", "#cbd5e1", "#f1f5f9", "#e0f2fe", "#f0f9ff"];
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
};

// --- PHYSICS CONSTANTS (TUNED FOR DRAMATIC CLUSTERING WITH RELATIVE SPACING) ---
export const DEFAULT_PHYSICS = {
    // Reduced repulsion to allow clustering (10x weaker than before)
    REPULSION: 5000,
    // Base spring length matches new node diameter
    SPRING_LENGTH: 40,
    // Stronger springs for tight clustering
    STIFFNESS: 0.3,
    // Slightly lower damping for smoother movement
    DAMPING: 0.88,
    // Stronger center pull to keep graph cohesive
    CENTER_GRAVITY: 0.0005
};

// Node sizing constants for relative spacing
export const NODE_DIAMETER = 40;
export const DIAMETER_MULTIPLIER = {
    MIN: 0.3,  // Strong connections (0.9+) → almost touching (12px)
    MAX: 3.0   // Weak connections (0.3-0.4) → far apart (120px)
};

// Helper function to generate diverse thought nodes
const generateThoughts = (): ThoughtNode[] => {
    const colors = ["#e2e8f0", "#cbd5e1", "#f1f5f9", "#e0f2fe", "#f0f9ff"];
    const getColor = () => colors[Math.floor(Math.random() * colors.length)];
    const getGradient = (color: string) => `linear-gradient(135deg, ${color}, ${color})`;

    // Diverse thought content organized by theme clusters
    const thoughtsByCluster = [
        // AI & Technology Cluster (0-9)
        [
            "Will AI replace my job or augment it?",
            "ChatGPT feels more human than some people I know",
            "Need to learn Python before it's too late",
            "The singularity might happen in our lifetime",
            "Why is debugging so satisfying when it finally works?",
            "Open source is humanity's greatest collaboration",
            "Should I be worried about my digital privacy?",
            "Quantum computing sounds like magic",
            "My entire life is backed up in the cloud",
            "Code is poetry for machines"
        ],
        // Philosophy & Meaning Cluster (10-19)
        [
            "What if this is all a simulation?",
            "Do we have free will or is everything predetermined?",
            "The meaning of life keeps changing as I age",
            "Existential dread hits different at 3am",
            "Maybe happiness isn't the goal, growth is",
            "We're all just atoms that learned to think about atoms",
            "Death gives life meaning, not the other way around",
            "Am I the same person I was 10 years ago?",
            "Consciousness might be the universe experiencing itself",
            "Every decision creates a parallel universe I'll never see"
        ],
        // Creativity & Art Cluster (20-29)
        [
            "Writer's block is just fear in disguise",
            "The best ideas come when I'm not trying",
            "Music is mathematics made emotional",
            "Every artist steals, the great ones just hide it better",
            "Imperfection makes art more human",
            "I want to create something that outlives me",
            "The blank canvas is both terrifying and thrilling",
            "Photography captures moments we'd otherwise forget",
            "Dancing is the body's way of speaking",
            "Abstract art makes me feel things I can't explain"
        ],
        // Nature & Environment Cluster (30-39)
        [
            "Climate change keeps me up at night",
            "There's something healing about being near water",
            "The stars remind me how small my problems are",
            "Trees have been here longer than human civilization",
            "Ocean waves follow the same patterns as brain waves",
            "Every sunset is proof that endings can be beautiful",
            "Nature doesn't hurry yet everything gets accomplished",
            "The smell of petrichor is better than any perfume",
            "Mountains make me feel grounded and free simultaneously",
            "Bees are dying and nobody seems to care enough"
        ],
        // Relationships & Social Cluster (40-49)
        [
            "I need to be better at keeping in touch",
            "Loneliness and solitude are completely different things",
            "My parents are aging faster than I want to admit",
            "Real friendship is rare and precious",
            "Social media made us connected but more alone",
            "Love is choosing someone every single day",
            "I miss the friends I had before we got busy with life",
            "Empathy is a superpower we don't teach enough",
            "Family isn't always blood",
            "Quality time beats expensive gifts every time"
        ],
        // Health & Wellness Cluster (50-59)
        [
            "I should drink more water",
            "Sleep is not optional, it's essential",
            "Mental health is just as important as physical health",
            "Exercise is the closest thing we have to a miracle drug",
            "Meditation is hard because our minds aren't used to stillness",
            "Nutrition science changes every decade",
            "Burnout is real and I might be experiencing it",
            "Walking in nature is free therapy",
            "Breathwork can literally change your nervous system",
            "Rest is productive, not lazy"
        ],
        // Career & Work Cluster (60-69)
        [
            "Imposter syndrome never really goes away",
            "Should I take the safe path or follow my passion?",
            "My dream job might not even exist yet",
            "Work-life balance is a myth, it's work-life integration",
            "Networking feels fake but it works",
            "Skills are more valuable than degrees now",
            "Remote work changed everything",
            "Automation will eliminate jobs but create new ones",
            "The hustle culture is toxic",
            "Mentorship accelerates growth exponentially"
        ],
        // Travel & Adventure Cluster (70-79)
        [
            "I want to visit Japan during cherry blossom season",
            "Solo travel is the best way to find yourself",
            "Every country I visit expands my perspective",
            "Travel is the only thing you buy that makes you richer",
            "I want to hike the Inca Trail before I'm too old",
            "Getting lost in a new city is scary and exciting",
            "Food is the best way to understand a culture",
            "I collect experiences, not things",
            "The Northern Lights are on my bucket list",
            "Traveling alone means eating dinner at weird hours"
        ],
        // Food & Cooking Cluster (80-89)
        [
            "Homemade pasta tastes like love and effort",
            "Cooking is chemistry you can eat",
            "The best meals are shared with good company",
            "Fermentation is controlled rot that tastes amazing",
            "I want to master sourdough bread",
            "Spices tell the story of human exploration",
            "Meal prep on Sunday saves my weeknight sanity",
            "Coffee is a ritual, not just caffeine",
            "Chocolate is proof that God loves us",
            "Farmers markets connect me to my food source"
        ],
        // Science & Learning Cluster (90-99)
        [
            "The universe is expanding faster than we thought",
            "Neuroplasticity means I can change at any age",
            "CRISPR will revolutionize medicine",
            "Dark matter is 85% of the universe and we barely understand it",
            "Learning a new language rewires your brain",
            "The human body is a universe of microorganisms",
            "Space is silent because there's no medium for sound",
            "Evolution is still happening in humans",
            "Math is the language of the universe",
            "We've only explored 5% of the ocean"
        ]
    ];

    const thoughts: ThoughtNode[] = [];
    let id = 1;

    // Generate nodes from clusters
    thoughtsByCluster.forEach((cluster, clusterIdx) => {
        // Position clusters in a circular arrangement
        const angle = (clusterIdx / thoughtsByCluster.length) * Math.PI * 2;
        const clusterRadius = 400 + Math.random() * 200;
        const centerX = Math.cos(angle) * clusterRadius;
        const centerY = Math.sin(angle) * clusterRadius;

        cluster.forEach((content, nodeIdx) => {
            const nodeId = String(id++);
            const color = getColor();

            // Position within cluster (tight grouping)
            const localAngle = (nodeIdx / cluster.length) * Math.PI * 2;
            const localRadius = 50 + Math.random() * 100;
            const x = centerX + Math.cos(localAngle) * localRadius;
            const y = centerY + Math.sin(localAngle) * localRadius;

            thoughts.push({
                id: nodeId,
                content,
                x, y,
                vx: 0, vy: 0,
                mass: 1,
                color,
                gradient: getGradient(color),
                connections: {}, // Will be filled below
                createdAt: Date.now() - (100 - parseInt(nodeId)) * 1000
            });
        });
    });

    // Add connections within and across clusters
    thoughts.forEach((thought, idx) => {
        const clusterIdx = Math.floor(idx / 10);
        const clusterStart = clusterIdx * 10;
        const clusterEnd = Math.min(clusterStart + 10, thoughts.length);

        // Strong intra-cluster connections (0.6-0.95)
        for (let i = clusterStart; i < clusterEnd; i++) {
            if (i === idx) continue;
            if (Math.random() < 0.4) { // 40% chance of connection within cluster
                const weight = 0.6 + Math.random() * 0.35;
                thought.connections[thoughts[i].id] = weight;
            }
        }

        // Weak inter-cluster connections (0.3-0.5)
        const numInterConnections = Math.floor(Math.random() * 3);
        for (let i = 0; i < numInterConnections; i++) {
            let targetIdx = Math.floor(Math.random() * thoughts.length);
            // Ensure it's from a different cluster
            const targetCluster = Math.floor(targetIdx / 10);
            if (targetCluster !== clusterIdx && targetIdx !== idx) {
                const weight = 0.3 + Math.random() * 0.2;
                thought.connections[thoughts[targetIdx].id] = weight;
            }
        }
    });

    return thoughts;
};

// 100 diverse thoughts with rich clustering patterns
export const INITIAL_THOUGHTS: ThoughtNode[] = generateThoughts();