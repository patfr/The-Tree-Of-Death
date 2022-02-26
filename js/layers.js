const Achievement = (n, d, t = "", u = true, s = "0px") => { return { name: n, done: d, tooltip: t, unlocked: u, style() { return { "border-radius": s, } } } }
const AchievementUnlocked = (id) => tmp.a.achievements[id].unlocked
const RadUpgrade = (n, u = true, s = "0px") => { return { title: `Rad ${n}`, description: " Add 1 to the base Death Points gain.", cost() { return new Decimal(1) }, unlocked: u, style() { return { "border-radius": s, } }} }
/* Credits to pg132 for this function */
const getLogisticTimeConstant = function(current, gain, loss) {
	if (current.eq(gain.div(loss))) return Infinity
	if (current.gt(gain.div(loss))) return current.times(loss).sub(gain).ln().div(-1).div(loss)
	return current.times(loss).sub(gain).times(-1).ln().div(-1).div(loss)
}

/* Credits to pg132 for this function */
const getLogisticAmount = function(current, gain, loss, diff) {
	if (current.eq(gain.div(loss))) return current
	if (gain.gte("ee10")) return gain.div(loss)
	if (current.lt(gain.div(loss))) {
			c = getLogisticTimeConstant(current, gain, loss)
			
			val1 = c.plus(diff) // t+c
			val2 = val1.times(-1).times(loss) // -B(t+c)
			val3 = Decimal.exp(val2) // this should be A-Bx
			val4 = gain.sub(val3) // should be A-(A-Bx) = Bx
			val5 = val4.div(loss) // should be x

			return val5.max(0)
	} else {
			c = getLogisticTimeConstant(current, gain, loss)
			
			val1 = c.plus(diff) // t+c
			val2 = val1.times(-1).times(loss) // -B(t+c)
			val3 = Decimal.exp(val2) // this should be Bx-A
			val4 = gain.plus(val3) // should be (Bx-A)+A
			val5 = val4.div(loss) // should be x

			return val5.max(0)
	}
}

addLayer("u", {
    name: "Uranium",
    symbol: "Ur",
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
		let cap = 4
		if (hasUpgrade("u", 23)) cap += upgradeEffect("u", 23)
		if (hasUpgrade("u", 24)) cap += upgradeEffect("u", 24)
		let base = player.points.add(1).ln().min(cap)
		if (hasMilestone("r", 1)) base = base.add(Math.floor(player.r.times / 5))
		if (hasUpgrade("u", 13)) base = base.mul(upgradeEffect("u", 13))
		if (hasUpgrade("u", 21)) base = base.mul(upgradeEffect("u", 21))
		if (hasUpgrade("u", 22)) base = base.mul(upgradeEffect("u", 22))
		if (hasUpgrade("u", 34)) base = base.pow(upgradeEffect("u", 34))
		return base
	},
	getLossRate() {
		let base = new Decimal(0.25)
		if (hasUpgrade("u", 12)) base = base.sub(upgradeEffect("u", 12))
		return base.max(0)
	},
	update(delta) {
		player.u.best = player.u.best.max(player.u.points)
		player.u.points = getLogisticAmount(player.u.points, tmp.u.getResetGain, tmp.u.getLossRate, delta)
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
		Info: {
			content: [
				() => ["raw-html",
					`<h2>Information:</h2><br><br><h3>Initial base gain:</h3> min(ln([Death Points] + 1), 4)`
				],
			],
		},
	},
	upgrades: {
		11: {
			title: "Uranium I",
			description: "ln([Best Uranium]) multiplies Death Point gain.",
			effect() {
				let eff = player.u.best.max(0.1).ln()
				if (hasUpgrade("u", 33)) eff = eff.mul(upgradeEffect("u", 31))
				return eff
			},
			effectDisplay() { return format(this.effect()) },
			cost() { return new Decimal(5) },
			style() {
				let s = {}
				s["border-radius"] = "10px"
				if (tmp.u.upgrades["12"].unlocked) s["border-radius"] = "10px 0 0 10px"
				if (tmp.u.upgrades["25"].unlocked) s["border-radius"] = "10px 0 0 0"
				return s
			},
		},
		12: {
			title: "Uranium II",
			description: "Each upgrade decreases Uranium loss by 1%. (Max: -24%)",
			cost() { return new Decimal(10) },
			effect() { return new Decimal(player.u.upgrades.length).div(100).min(0.24) },
			effectDisplay() { return `-${format(this.effect().mul(100))}%` },
			style() {
				let s = {}
				s["border-radius"] = "0 10px 10px 0"
				if (tmp.u.upgrades["13"].unlocked) s["border-radius"] = "0"
				return s
			},
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
			style() {
				let s = {}
				s["border-radius"] = "0 10px 10px 0"
				if (tmp.u.upgrades["14"].unlocked) s["border-radius"] = "0"
				return s
			},
			unlocked() { return hasUpgrade("u", 12) },
		},
		14: {
			title: "Uranium IV",
			description: "Uranium III now also multiplies Death Point gain at an increased rate.",
			cost() { return new Decimal(140) },
			effect() { return upgradeEffect("u", 13).mul(2) },
			effectDisplay() { return `x${format(this.effect())}` },
			style() {
				let s = {}
				s["border-radius"] = "0 10px 10px 0"
				if (tmp.u.upgrades["15"].unlocked) s["border-radius"] = "0"
				return s
			},
			unlocked() { return hasUpgrade("u", 13) },
		},
		15: {
			title: "Uranium V",
			description: "Uranium III effect is doubled.",
			cost() { return new Decimal(200) },
			style() {
				let s = {}
				s["border-radius"] = "0 10px 10px 0"
				if (tmp.u.upgrades["25"].unlocked) s["border-radius"] = "0 10px 0 0"
				return s
			},
			unlocked() { return hasUpgrade("u", 14) },
		},
		21: {
			title: "Uranium VI",
			description: "Double Uranium gain.",
			cost() { return new Decimal(593) },
			effect() { return new Decimal(2) },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 10px"
				if (tmp.u.upgrades["22"].unlocked) s["border-radius"] = "0 0 0 10px"
				if (tmp.u.upgrades["35"].unlocked) s["border-radius"] = "0"
				return s
			},
			unlocked() { return hasUpgrade("u", 15) },
		},
		22: {
			title: "Uranium VII",
			description: "Triple Uranium gain.",
			cost() { return new Decimal(1333) },
			effect() { return new Decimal(3) },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 0"
				if (tmp.u.upgrades["23"].unlocked) s["border-radius"] = "0"
				return s
			},
			unlocked() { return hasUpgrade("u", 21) },
		},
		23: {
			title: "Uranium VIII",
			description: "Make Uranium base hardcap start later.",
			cost() { return new Decimal(5020) },
			effect() { return 5 },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 0"
				if (tmp.u.upgrades["24"].unlocked) s["border-radius"] = "0"
				return s
			},
			unlocked() { return hasUpgrade("u", 22) },
		},
		24: {
			title: "Uranium IX",
			description: "Make Uranium base hardcap start even later.",
			cost() { return new Decimal(12595) },
			effect() { return new Decimal(10) },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 0"
				if (tmp.u.upgrades["25"].unlocked) s["border-radius"] = "0"
				return s
			},
			unlocked() { return hasUpgrade("u", 23) },
		},
		25: {
			title: "Uranium X",
			description: "Raise Death Point gain by ^2.",
			cost() { return new Decimal(1.4e4) },
			effect() { return new Decimal(2) },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 0"
				if (tmp.u.upgrades["35"].unlocked) s["border-radius"] = "0"
				return s
			},
			unlocked() { return hasUpgrade("u", 24) },
		},
		31: {
			title: "Uranium XI",
			description: "ln([Best Uranium]) multiplies Death Point gain.",
			cost() { return new Decimal(2.2e4) },
			effect() {
				let eff = player.u.best.max(0.1)
				return hasUpgrade("u", 32) ? eff.log2() : eff.ln() 
			},
			effectDisplay() { return format(this.effect()) },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 10px"
				if (tmp.u.upgrades["32"].unlocked) s["border-radius"] = "0 0 0 10px"
				return s
			},
			unlocked() { return hasUpgrade("u", 25) },
		},
		32: {
			title: "Uranium XII",
			description: "Uranium XI uses log2 instead of ln.",
			cost() { return new Decimal(2.8e4) },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 0"
				if (tmp.u.upgrades["33"].unlocked) s["border-radius"] = "0"
				return s
			},
			unlocked() { return hasUpgrade("u", 31) },
		},
		33: {
			title: "Uranium XIII",
			description: "Uranium XI multiplies Uranium I.",
			cost() { return new Decimal(3.3e4) },
			effect() { return 5 },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 0"
				if (tmp.u.upgrades["34"].unlocked) s["border-radius"] = "0"
				return s
			},
			unlocked() { return hasUpgrade("u", 32) },
		},
		34: {
			title: "Uranium XIV",
			description: "Raise Uranium gain by 1.1.",
			cost() { return new Decimal(4.5e4) },
			effect() { return new Decimal(1.1) },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 0"
				if (tmp.u.upgrades["35"].unlocked) s["border-radius"] = "0"
				return s
			},
			unlocked() { return hasUpgrade("u", 33) },
		},
		35: {
			title: "Uranium XV",
			description: "Unlock a new layer.",
			cost() { return new Decimal(1.25e5) },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 0"
				//if (tmp.u.upgrades["45"].unlocked) s["border-radius"] = "0"
				return s
			},
			unlocked() { return hasUpgrade("u", 34) },
		},
	},
	branches: [
		["r", function() { return player.r.unlocked ? "#614a00" : "#303030" }, 25],
	],
	doReset(layer) {
		if (layers[layer].row == this.row) return
		let keep = []
		const upgrades = [...player.u.upgrades]
		layerDataReset("u", keep)
		if (hasMilestone("r", 0)) {
			const c = Math.floor(player.r.times / 5) * 3
			for (let i = 0; i < c; i++) {
				const id = 10 + (i % 5) + (Math.floor(i / 5) * 10 + 1)
				if (upgrades.includes(id)) player.u.upgrades.push(id)
			}
			player.points = new Decimal(0.1)
			player.u.best = new Decimal(2)
		}
	},
})

addLayer("r", {
	name: "Rads",
    symbol: "Ra",
    position: 1,
    startData() { return {
        unlocked: false,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
		times: 0,
    } },
    color: "#633127",
    requires: new Decimal(1.45e5),
    resource: "Rads",
    baseResource: "Uranium",
    baseAmount() { return player.u.points },
    type: "normal",
    row: 1,
	displayRow: 0,
	exponent: 1,
	passiveGeneration() { return hasMilestone("r", 3) ? 1 : 0 },
    layerShown() { return player.r.unlocked || hasUpgrade("u", 35) },
	update(delta) {
		if (hasMilestone("r", 2)) player.r.times += delta
	},
	onPrestige() {
		player.r.times++;
	},
	tabFormat: {
		Upgrades: {
			content: [
				"main-display",
				"prestige-button",
				"blank",
				"upgrades",
			],
		},
		Milestones: {
			content: [
				"main-display",
				() => ["display-text", `You have done ${formatWhole(player.r.times)} Rads resets`],
				"blank",
				"milestones",
			],
		},
	},
	upgrades: {
		11: RadUpgrade("I", u=true, s="10px 0 0 0"),
		12: RadUpgrade("II"),
		13: RadUpgrade("III"),
		14: RadUpgrade("IV"),
		15: RadUpgrade("V", u=true, s="0 10px 0 0"),

		21: RadUpgrade("VI"),
		22: RadUpgrade("VII"),
		23: RadUpgrade("VIII"),
		24: RadUpgrade("IX"),
		25: RadUpgrade("X"),

		31: RadUpgrade("XI"),
		32: RadUpgrade("XII"),
		33: RadUpgrade("XIII"),
		34: RadUpgrade("XIV"),
		35: RadUpgrade("XV"),

		41: RadUpgrade("XVI"),
		42: RadUpgrade("XVII"),
		43: RadUpgrade("XVIII"),
		44: RadUpgrade("XIX"),
		45: RadUpgrade("XX"),

		51: RadUpgrade("XXI", u=true, s="0 0 0 10px"),
		52: RadUpgrade("XXII"),
		53: RadUpgrade("XXIII"),
		54: RadUpgrade("XXIV"),
		55: RadUpgrade("XXV", u=true, s="0 0 10px 0"),
	},
	milestones: {
		0: {
			requirementDescription: "5 Rads resets (1)",
			effectDescription: "Every 5 Rads resets keep three Uranium upgrade.",
			done() { return player.r.times >= 5 },
			style() { return { "border-radius": "5px 5px 0 0" } },
		},
		1: {
			requirementDescription: "10 Rads resets (2)",
			effectDescription: "Every 5 Rads resets a 1 to the base Uranium gain.",
			done() { return player.r.times >= 10 },
		},
		2: {
			requirementDescription: "25 Rads resets (3)",
			effectDescription: "Gain 1 Rads resets per second.",
			done() { return player.r.times >= 20 },
		},
		3: {
			requirementDescription: "50 Rads resets (4)",
			effectDescription: "Gain 100% of Rads per second.",
			done() { return player.r.times >= 50 },
			style() { return { "border-radius": "0 0 5px 5px" } },
		},
	},
})

const achData = [
	{ Name: "The Beginning", Color: "lime", Rows: [1, 2, 3] },
	{ Name: "Mutation", Color: "purple", Rows: [4] },
]

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
		() => {
			let data = ["column", []]
			achData.forEach(e => {
				data[1].push(["display-text", `<h3 style='color:${e.Color}'>${e.Name}</h3>`])
				data[1].push("blank")
				data[1].push(["achievements", e.Rows])
				data[1].push(["blank", "50px"])
			});
			return data
		},
	],
	achievements: {
		11: Achievement("One", () => player.points.gte(1), t="Get 1 Death Points", u=true, s="10px 0 0 0"),
		12: Achievement("Two", () => player.points.gte(10), t="Get 10 Death Points"),
		13: Achievement("Three", () => player.points.gte(100), t="Get 100 Death Points"),
		14: Achievement("Four", () => player.points.gte(500), t="Get 500 Death Points"),
		15: Achievement("Five", () => player.points.gte(1e3), t="Get 1,000 Death Points"),
		16: Achievement("Six", () => player.points.gte(2e3), t="Get 2,000 Death Points"),
		17: Achievement("Seven", () => player.points.gte(3e3), t="Get 3,000 Death Points", u=true, s="0 10px 0 0"),
		
		21: Achievement("Eight", () => player.u.points.gte(1), t="Get 1 Uranium"),
		22: Achievement("Nine", () => player.u.points.gte(5), t="Get 5 Uranium"),
		23: Achievement("Ten", () => player.u.points.gte(10), t="Get 10 Uranium"),
		24: Achievement("Eleven", () => player.u.points.gte(15), t="Get 15 Uranium"),
		25: Achievement("Twelve", () => player.u.points.gte(100), t="Get 100 Uranium"),
		26: Achievement("Thirteen", () => player.u.points.gte(300), t="Get 300 Uranium"),
		27: Achievement("Fourteen", () => player.u.points.gte(400), t="Get 400 Uranium",),

		31: Achievement("Fifteen", () => player.u.points.gte(1e3), t="Get 1,000 Uranium", u=true, s="0 0 0 10px"),
		32: Achievement("Sixteen", () => player.u.points.gte(2e3), t="Get 2,000 Uranium"),
		33: Achievement("Seventeen", () => player.u.points.gte(3e3), t="Get 3,000 Uranium"),
		34: Achievement("Eighteen", () => player.u.points.gte(4e3), t="Get 4,000 Uranium"),
		35: Achievement("Nineteen", () => player.u.points.gte(8e3), t="Get 8,000 Uranium"),
		36: Achievement("Twenty", () => player.u.points.gte(1.5e4), t="Get 15,000 Uranium"),
		37: Achievement("Twenty-one", () => player.u.points.gte(1.7e4), t="Get 17,000 Uranium", u=true, s="0 0 10px 0"),

		41: Achievement("Twenty-two", () => player.r.times >= 1, t="1 Rads resets", u=true, s="10px 0 0 10px"),
		42: Achievement("Twenty-three", () => player.r.times >= 5, t="5 Rads resets"),
		43: Achievement("Twenty-four", () => player.r.times >= 10, t="10 Rads resets"),
		44: Achievement("Twenty-five", () => player.r.times >= 15, t="15 Rads resets"),
		45: Achievement("Twenty-six", () => player.r.times >= 20, t="20 Rads resets"),
		46: Achievement("Twenty-seven", () => player.r.times >= 25, t="25 Rads resets"),
		47: Achievement("Twenty-eight", () => player.r.times >= 100, t="100 Rads resets", u=true, s="0 10px 10px 0"),
	},
})