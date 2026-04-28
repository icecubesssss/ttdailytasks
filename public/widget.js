// TT Daily Task - Scriptable Widget (Large & Small Support)
// For Tít & Tún - Productivity for Couples
(async () => {
    // Configs
    const appId = "tt-daily-task";
    const users = [
        { id: "tit", uid: "XR4Z15wXvrgoY68XKPcEzDfhbBz1", name: "TÍT NGẦU LÒI" },
        { id: "tun", uid: "DnvU6r5jGBZu9oKBQpaummXtId93", name: "TÚN CHĂM CHỈ" }
    ];

    // Fetch Helper
    async function getDoc(path) {
        const url = `https://firestore.googleapis.com/v1/projects/tt-daily-task/databases/(default)/documents/${path}`;
        let req = new Request(url);
        try { return await req.loadJSON(); } catch(e) { return null; }
    }

    async function getCollection(path) {
        const url = `https://firestore.googleapis.com/v1/projects/tt-daily-task/databases/(default)/documents/${path}`;
        let req = new Request(url);
        try { return await req.loadJSON(); } catch(e) { return null; }
    }

    // 1. Fetch Data for both users
    const results = await Promise.all([
        getDoc(`artifacts/${appId}/users/${users[0].uid}/profile/stats`),
        getDoc(`artifacts/${appId}/users/${users[1].uid}/profile/stats`),
        getCollection(`artifacts/${appId}/public/data/tasks`)
    ]);

    const stats = {
        tit: results[0] || {},
        tun: results[1] || {}
    };
    const allTasks = results[2]?.documents || [];

    // Helper to extract value from Firestore JSON
    const val = (doc, field, type = "integerValue") => {
        return doc?.fields?.[field]?.[type];
    };

    const getFocusTask = (uid) => {
        const runningTask = allTasks.find(t => 
            val(t, "status", "stringValue") === "running" && 
            val(t, "currentWorker", "stringValue") === uid
        );
        return runningTask ? val(runningTask, "title", "stringValue") : null;
    };

    // Prepare User Data Objects
    const userData = users.map(u => ({
        ...u,
        streak: val(stats[u.id], "streak") || 0,
        freezes: val(stats[u.id], "streakFreezes") || 0,
        lastCheckIn: val(stats[u.id], "lastCheckIn", "stringValue") || "",
        focusTask: getFocusTask(u.uid)
    }));

    let today = new Date();
    let hour = today.getHours();

    // =============== THEMES ===============
    const getTheme = (isDone) => {
        if (isDone) return {
            title: "💚 RẢNH TAY RỒI",
            colors: ["#166534", "#064e3b"],
            symbol: "checkmark.seal.fill",
            symbolColor: "#86efac"
        };
        if (hour < 12) return {
            title: "☀️ CHÀO BUỔI SÁNG",
            colors: ["#ea580c", "#7c2d12"],
            symbol: "sun.max.fill",
            symbolColor: "#fde047"
        };
        if (hour < 18) return {
            title: "⚡ CHIỀU ĐẾN RỒI",
            colors: ["#6d28d9", "#2e1065"],
            symbol: "bolt.fill",
            symbolColor: "#fcd34d"
        };
        if (hour < 22) return {
            title: "⚠️ KHẨN CẤP",
            colors: ["#be123c", "#4c0519"],
            symbol: "bell.badge.fill",
            symbolColor: "#fca5a5"
        };
        return {
            title: "🚨 SOS!! SOS!!!",
            colors: ["#000000", "#450a0a"],
            symbol: "skull.fill",
            symbolColor: "#dc2626"
        };
    };

    // For simplicity, we use Tit's status for the global theme if small
    let mainTheme = getTheme(userData[0].lastCheckIn === today.toDateString());

    // =============== INTERFACE ===============
    let w = new ListWidget();
    w.setPadding(12, 12, 12, 12);
    let grad = new LinearGradient();
    grad.colors = [new Color(mainTheme.colors[0]), new Color(mainTheme.colors[1])];
    grad.locations = [0, 1];
    w.backgroundGradient = grad;

    if (config.widgetFamily === "large" || !config.runsInWidget) {
        // --- LARGE VIEW: BOTH USERS ---
        w.addSpacer();
        let mainStack = w.addStack();
        mainStack.layoutVertically();

        userData.forEach((user, idx) => {
            let uStack = mainStack.addStack();
            uStack.layoutHorizontally();
            uStack.centerAlignContent();
            uStack.backgroundColor = new Color("#ffffff", 0.1);
            uStack.cornerRadius = 15;
            uStack.setPadding(12, 12, 12, 12);

            // Left: Icon & Streak
            let leftSide = uStack.addStack();
            leftSide.layoutVertically();
            leftSide.centerAlignContent();
            
            let symbolImg = SFSymbol.named(user.focusTask ? "play.circle.fill" : "person.fill").image;
            let icon = leftSide.addImage(symbolImg);
            icon.imageSize = new Size(30, 30);
            icon.tintColor = user.focusTask ? new Color("#60a5fa") : new Color("#ffffff", 0.8);
            
            leftSide.addSpacer(2);
            let sLabel = leftSide.addText(String(user.streak));
            sLabel.font = Font.blackRoundedSystemFont(20);
            sLabel.textColor = new Color("#ffffff");

            uStack.addSpacer(12);

            // Right: Info
            let rightSide = uStack.addStack();
            rightSide.layoutVertically();
            
            let nText = rightSide.addText(user.name);
            nText.font = Font.boldSystemFont(14);
            nText.textColor = new Color("#fcd34d");

            rightSide.addSpacer(2);
            
            let fText = rightSide.addText(user.focusTask ? `🔥 Đang làm: ${user.focusTask}` : "💤 Đang nghỉ ngơi...");
            fText.font = Font.mediumSystemFont(12);
            fText.textColor = user.focusTask ? new Color("#ffffff") : new Color("#ffffff", 0.6);
            fText.lineLimit = 2;

            if (idx === 0) mainStack.addSpacer(12);
        });
        w.addSpacer();
    } else {
        // --- SMALL VIEW: SELECTED USER ---
        let userArg = (args.widgetParameter || "tit").toLowerCase().trim();
        let user = userData.find(u => u.id === userArg || u.name.includes(userArg.toUpperCase())) || userData[0];
        
        let header = w.addStack();
        header.centerAlignContent();
        let tEl = header.addText(mainTheme.title);
        tEl.font = Font.boldSystemFont(10);
        tEl.textColor = new Color("#ffffff", 0.7);
        header.addSpacer();
        let nameEl = header.addText(user.id.toUpperCase());
        nameEl.font = Font.blackSystemFont(10);
        nameEl.textColor = new Color("#fcd34d");

        w.addSpacer();

        let center = w.addStack();
        center.centerAlignContent();
        let cIcon = center.addImage(SFSymbol.named(user.focusTask ? "play.fill" : mainTheme.symbol).image);
        cIcon.imageSize = new Size(30, 30);
        cIcon.tintColor = new Color(mainTheme.symbolColor);
        center.addSpacer(8);
        let sNum = center.addText(String(user.streak));
        sNum.font = Font.blackRoundedSystemFont(40);
        sNum.textColor = new Color("#ffffff");

        w.addSpacer();
        let statusText = w.addText(user.focusTask ? `Đang làm: ${user.focusTask}` : "CHƯA LÀM GÌ CẢ!");
        statusText.font = Font.boldSystemFont(11);
        statusText.textColor = new Color("#ffffff", 0.9);
        statusText.lineLimit = 1;
    }

    w.url = "https://tt-daily-task.web.app/";
    w.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 15);

    Script.setWidget(w);
    Script.complete();
    if (!config.runsInWidget) {
        w.presentLarge();
    }
})();

