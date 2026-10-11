export const translations = {
  el: {
    app: {
      title: "Εργαστήριο Αλγορίθμων",
      language: "Γλώσσα", greek: "Ελληνικά", english: "English",
      subtitle:
        "Οπτικοποίησε, δοκίμασε και σύγκρινε αλγορίθμους.",
    },

    pathfinding: {
      title: "Pathfinding — BFS / DFS / Dijkstra / A*", description: "Μπλε: εξερεύνηση · Κίτρινο: διαδρομή. Η ταχύτητα αφορά μόνο το animation, όχι τη μέτρηση του αλγορίθμου.",
      idle: "Σχεδίασε terrain και εμπόδια, επίλεξε αλγόριθμο και πάτησε Οπτικοποίηση.",
      searchNote: "Dijkstra/A* ελαχιστοποιούν το συνολικό κόστος. BFS/DFS αγνοούν τα weights στην αναζήτηση: ο BFS ελαχιστοποιεί βήματα (και κόστος μόνο σε uniform-cost grid), ενώ ο DFS δεν εγγυάται βέλτιστη διαδρομή.",
      running: "Η αναζήτηση οπτικοποιείται…", found: "Βρέθηκε διαδρομή.",
      noPath: "Δεν υπάρχει διαδρομή.", error: "Δεν ήταν δυνατή η εκτέλεση. Έλεγξε το grid και δοκίμασε ξανά.",
      comparison: {
        title: "Σύγκριση διαδρομών", ready: "Η σύγκριση ολοκληρώθηκε. Δες τα αποτελέσματα στον πίνακα.",
        caption: "Αποτελέσματα αλγορίθμων στο ίδιο weighted grid",
        note: "Τρέχουν όλοι οι διαθέσιμοι αλγόριθμοι στο ίδιο grid, χωρίς animation. Σύγκρινε βήματα και κόστος χωριστά: μόνο Dijkstra/A* εγγυώνται ελάχιστο κόστος με διαφορετικά weights.",
        errors: { runner_error: "Η εκτέλεση απέτυχε.", invalid_result: "Ο αλγόριθμος επέστρεψε μη έγκυρο αποτέλεσμα.", invalid_clock: "Δεν ήταν δυνατή η μέτρηση χρόνου." },
      },
      statistics: {
        title: "Στατιστικά διαδρομής", algorithm: "Αλγόριθμος", found: "Βρέθηκε διαδρομή",
        yes: "Ναι", no: "Όχι", visited: "Visited nodes", length: "Μήκος διαδρομής (βήματα)", time: "Χρόνος εκτέλεσης", cost: "Συνολικό κόστος",
        note: "Το κόστος αθροίζει τα cells μετά το start, χωρίς χρέωση της αρχής. Το μήκος μετρά βήματα μεταξύ cells· — σημαίνει ότι δεν υπάρχει διαδρομή. Ο χρόνος αφορά μόνο τον αλγόριθμο, χωρίς animation ή rendering. Μία μέτρηση δεν αποτελεί γενικό συμπέρασμα απόδοσης.",
      },
    },

    terrain: { title: "Terrain και εμπόδια", tool: "Εργαλείο σχεδίασης", wall: "Εμπόδιο", plain: "Απλό έδαφος", mud: "Λάσπη", water: "Νερό", clear: "Καθαρισμός terrain", note: "Κλικ σε cell: το επιλεγμένο terrain ορίζει κόστος εισόδου 1/3/5. Τα walls είναι αδιάβατα. Clear path κρατά terrain/walls· Clear walls κρατά terrain· Clear terrain κρατά walls· Reset καθαρίζει και τα δύο. Το start δεν χρεώνεται." },
    grid: { cell: (row: number, col: number) => `Κελί γραμμής ${row}, στήλης ${col}`, plain: "Απλό έδαφος", mud: "Λάσπη", water: "Νερό", wall: "Εμπόδιο", cost: "Κόστος" },

    backendStatus: {
      loading: "Έλεγχος σύνδεσης με το backend...",
      online: "Το backend είναι διαθέσιμο",
      offline: "Δεν είναι δυνατή η σύνδεση με το backend",
    },

    toolbar: {
      ariaLabel: "Εργαλεία αλγορίθμων",
      algorithmLabel: "Αλγόριθμος",
      speedLabel: "Ταχύτητα",
      visualize: "Οπτικοποίηση",
      compare: "Σύγκριση",
      resetGrid: "Επαναφορά πλέγματος",
      clearWalls: "Καθαρισμός εμποδίων",
      clearPath: "Καθαρισμός διαδρομής",
    },

    algorithms: {
      bfs: "BFS",
      dfs: "DFS",
      dijkstra: "Dijkstra",
      astar: "A*",
    },

    speed: {
      slow: "Αργά",
      normal: "Κανονικά",
      fast: "Γρήγορα",
    },

    algorithmLibrary: {
      eyebrow: "Sorting & Pathfinding",
      title: "Βιβλιοθήκη Αλγορίθμων",
      description:
        "Εξερεύνησε πώς λειτουργούν οι sorting και pathfinding algorithms, τις εγγυήσεις τους και μικρά παραδείγματα.",
      loading: "Φόρτωση αλγορίθμων...",
      error:
        "Δεν ήταν δυνατή η φόρτωση των αλγορίθμων.",
      retry: "Νέα προσπάθεια",
      empty: "Δεν υπάρχουν διαθέσιμοι αλγόριθμοι.",
      problem: "Πρόβλημα",
      bestCase: "Καλύτερη περίπτωση",
      averageCase: "Μέση περίπτωση",
      worstCase: "Χειρότερη περίπτωση",
      spaceComplexity: "Χωρική πολυπλοκότητα",
      implementations: "Υλοποιήσεις",
      reference: "αναφοράς",
    },
  },

  en: {
    app: {
      title: "Algorithm Lab",
      language: "Language", greek: "Ελληνικά", english: "English",
      subtitle:
        "Visualize, test and compare algorithms.",
    },

    pathfinding: {
      title: "Pathfinding — BFS / DFS / Dijkstra / A*", description: "Blue: exploration · Yellow: path. Speed affects animation only, not algorithm measurement.",
      idle: "Paint terrain and walls, choose an algorithm and press Visualize.",
      searchNote: "Dijkstra/A* minimize total cost. BFS/DFS ignore weights during search: BFS minimizes steps (and cost only on uniform-cost grids), while DFS does not guarantee an optimal path.",
      running: "Animating the search…", found: "Path found.",
      noPath: "No path exists.", error: "The search could not run. Check the grid and try again.",
      comparison: {
        title: "Path comparison", ready: "Comparison completed. See the results in the table.",
        caption: "Algorithm results on the same weighted grid",
        note: "All available algorithms run on the same grid without animation. Compare steps and cost separately: only Dijkstra/A* guarantee minimum cost with varying weights.",
        errors: { runner_error: "Execution failed.", invalid_result: "The algorithm returned an invalid result.", invalid_clock: "Execution time could not be measured." },
      },
      statistics: {
        title: "Path statistics", algorithm: "Algorithm", found: "Path found",
        yes: "Yes", no: "No", visited: "Visited nodes", length: "Path length (steps)", time: "Execution time", cost: "Total cost",
        note: "Cost sums cells after the start, excluding the starting cell. Length counts steps between cells; — means no path exists. Time measures the algorithm only, excluding animation and rendering. A single measurement is not a general performance conclusion.",
      },
    },

    terrain: { title: "Terrain and walls", tool: "Paint tool", wall: "Wall", plain: "Plain", mud: "Mud", water: "Water", clear: "Clear terrain", note: "Click a cell: selected terrain sets entering cost 1/3/5. Walls are blocked. Clear path preserves terrain/walls; Clear walls preserves terrain; Clear terrain preserves walls; Reset clears both. The start is not charged." },
    grid: { cell: (row: number, col: number) => `Cell row ${row}, column ${col}`, plain: "Plain", mud: "Mud", water: "Water", wall: "Wall", cost: "Cost" },

    backendStatus: {
      loading: "Checking backend connection...",
      online: "Backend is available",
      offline: "Unable to connect to the backend",
    },

    toolbar: {
      ariaLabel: "Algorithm tools",
      algorithmLabel: "Algorithm",
      speedLabel: "Speed",
      visualize: "Visualize",
      compare: "Compare",
      resetGrid: "Reset grid",
      clearWalls: "Clear walls",
      clearPath: "Clear path",
    },

    algorithms: {
      bfs: "BFS",
      dfs: "DFS",
      dijkstra: "Dijkstra",
      astar: "A*",
    },

    speed: {
      slow: "Slow",
      normal: "Normal",
      fast: "Fast",
    },

    algorithmLibrary: {
      eyebrow: "Sorting & Pathfinding",
      title: "Algorithm Library",
      description:
        "Explore how sorting and pathfinding algorithms work, their guarantees and small examples.",
      loading: "Loading algorithms...",
      error: "Unable to load the algorithms.",
      retry: "Try again",
      empty: "No algorithms are currently available.",
      problem: "Problem",
      bestCase: "Best case",
      averageCase: "Average case",
      worstCase: "Worst case",
      spaceComplexity: "Space complexity",
      implementations: "Implementations",
      reference: "reference",
    },
  },
} as const;

export type Language = keyof typeof translations;
export type AppTexts = (typeof translations)[Language];
