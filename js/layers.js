const Achievement = (n, d, t = "", u = true, s = "0px") => { return { name: n, done: d, tooltip: t, unlocked: u, style() { return { "border-radius": s, } } } }
const AchievementUnlocked = (id) => tmp.a.achievements[id].unlocked

addLayer("u", {
    name: "Uranium",
    symbol: "U",
    position: 0,
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
    } },
    color: "#106b00",
    requires: new Decimal(0),
    resource: "Uranium",
    baseResource: "Death Points",
    baseAmount() { return player.points },
    type: "none",
    row: 0,
	displayRow: 0,
    layerShown() { return true },
	getResetGain() {
		let base = player.points.add(1).ln().min(4)
		if (hasUpgrade("u", 13)) base = base.mul(upgradeEffect("u", 13))
		return base
	},
	getLossRate() {
		let base = new Decimal(0.25)
		if (hasUpgrade("u", 12)) base = base.sub(upgradeEffect("u", 12))
		return base.max(0)
	},
	update(delta) {
		addPoints("u", tmp.u.getResetGain.mul(delta))
		player.u.points = player.u.points.sub(player.u.points.mul(tmp.u.getLossRate).mul(delta)).max(0)
	},
	tabFormat: {
		Upgrades: {
			content: [
				"main-display",
				["display-text",
					function(){
						return `You are getting ${format(tmp.u.getResetGain)} Uranium per second`
					},
				],
				["display-text",
					function(){
						return `You are losing ${format(tmp.u.getLossRate.mul(100))}% of your Uranium per second`
					},
				],
				"blank",
				"upgrades",
			],
		},
	},
	upgrades: {
		11: {
			title: "Uranium I",
			description: "ln([Best Uranium]) multiplies Death Point gain.",
			effect() { return player.u.best.max(0.1).ln() },
			effectDisplay() { return format(this.effect()) },
			cost() { return new Decimal(5) },
			style() { return { 
				"border-radius": (hasUpgrade("u", 11) ? "10px 0 0 10px" : "10px 10px 10px 10px"),
			} },
		},
		12: {
			title: "Uranium II",
			description: "Each upgrade decreases Uranium loss by 1%. (Max: 24%)",
			cost() { return new Decimal(10) },
			effect() { return new Decimal(player.u.upgrades.length).div(100).min(0.24) },
			effectDisplay() { return `-${format(this.effect().mul(100))}%` },
			style() { return {
				"border-radius": (hasUpgrade("u", 12) ? "0 0 0 0" : "0 10px 10px 0"),
			} },
			unlocked() { return hasUpgrade("u", 11) },
		},
		13: {
			title: "Uranium III",
			description: "Achievements + 1 multiplies Uranium gain.",
			cost() { return new Decimal(13) },
			effect() { 
				let base = new Decimal(player.a.achievements.length).add(1) 
				if (hasUpgrade("u", 15)) base = base.mul(2)
				return base
			},
			effectDisplay() { return `x${format(this.effect())}` },
			style() { return {
				"border-radius": (hasUpgrade("u", 13) ? "0 0 0 0" : "0 10px 10px 0"),
			} },
			unlocked() { return hasUpgrade("u", 12) },
		},
		14: {
			title: "Uranium IV",
			description: "Uranium III now also multiplies Death Point gain at an increased rate.",
			cost() { return new Decimal(140) },
			effect() { return upgradeEffect("u", 13).mul(2) },
			effectDisplay() { return `x${format(this.effect())}` },
			style() { return {
				"border-radius": (hasUpgrade("u", 14) ? "0 0 0 0" : "0 10px 10px 0"),
			} },
			unlocked() { return hasUpgrade("u", 13) },
		},
		15: {
			title: "Uranium V",
			description: "Uranium III effect is doubled.",
			cost() { return new Decimal(200) },
			style() { return {
				"border-radius": "0 10px 10px 0",
			} },
			unlocked() { return hasUpgrade("u", 14) },
		},
	},
})

addLayer("a", {
    name: "Achievements",
    symbol: "A",
    startData() { return {
        unlocked: true,
    }},
    color: "#ffff00",
    row: "side",
	type: "none",
	tooltip: "Achievements",
    layerShown(){return true},
	tabFormat: [
		["display-text", "<h1>Achievements</h1>"],
		"blank",
		["display-text", "<h3 style='color:lime'>The Beginning</h3>"],
		"blank",
		"achievements",
	],
	achievements: {
		11: Achievement("One", () => player.points.gte(1), t="Get 1 Death Points", u=true, s="10px 0 0 0"),
		12: Achievement("Two", () => player.points.gte(10), t="Get 10 Death Points"),
		13: Achievement("Three", () => player.points.gte(100), t="Get 100 Death Points"),
		14: Achievement("Four", () => player.points.gte(500), t="Get 500 Death Points"),
		15: Achievement("Five", () => player.points.gte(1e3), t="Get 1,000 Death Points"),
		16: Achievement("Six", () => player.points.gte(2e3), t="Get 2,000 Death Points"),
		17: Achievement("Seven", () => player.points.gte(3e3), t="Get 3,000 Death Points", u=true, s="0 10px 0 0"),
		
		21: Achievement("Eight", () => player.u.points.gte(1), t="Get 1 Uranium", u=true, s="0 0 0 10px"),
		22: Achievement("Nine", () => player.u.points.gte(5), t="Get 5 Uranium"),
		23: Achievement("Ten", () => player.u.points.gte(10), t="Get 10 Uranium"),
		24: Achievement("Eleven", () => player.u.points.gte(15), t="Get 15 Uranium"),
		25: Achievement("Twelve", () => player.u.points.gte(100), t="Get 100 Uranium"),
		26: Achievement("Therteen", () => player.u.points.gte(300), t="Get 300 Uranium"),
		27: Achievement("Fourteen", () => player.u.points.gte(400), t="Get 400 Uranium", u=true, s="0 0 10px 0"),
	},
})