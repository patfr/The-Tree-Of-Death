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
	getBaseCap() {
		let cap = 4
		if (hasUpgrade("u", 23)) cap += upgradeEffect("u", 23)
		if (hasUpgrade("u", 24)) cap += upgradeEffect("u", 24)
		return cap
	},
	getBaseGain() {
		let base = player.points.add(1).ln().min(tmp.u.getBaseCap)
		if (hasMilestone("r", 1)) base = base.add(Math.min(Math.floor(player.r.times / 5), 40))
		return base
	},
	getResetGain() {
		let gain = tmp.u.getBaseGain
		if (hasUpgrade("u", 13)) gain = gain.mul(upgradeEffect("u", 13))
		if (hasUpgrade("u", 21)) gain = gain.mul(upgradeEffect("u", 21))
		if (hasUpgrade("u", 22)) gain = gain.mul(upgradeEffect("u", 22))
		if (hasUpgrade("t", 22)) gain = gain.mul(upgradeEffect("t", 22))
		if (hasUpgrade("u", 34)) gain = gain.pow(upgradeEffect("u", 34))
		return gain
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
				() => ["display-text", `You are gaining ${format(tmp.u.getResetGain)} Uranium before loss`],
				() => ["display-text", `You are losing ${format(tmp.u.getLossRate.mul(100))}% of your Uranium`],
				() => ["display-text", `You are gaining ${format(getLogisticAmount(player.u.points, tmp.u.getResetGain, tmp.u.getLossRate, 1).sub(player.u.points))} Uranium per second`],
				"blank",
				"upgrades",
			],
		},
		Info: {
			content: [
				() => ["raw-html",
					`<h1 style='color:red'>Information:</h1><br><br>
					<h2 style='color:maroon'>Initially resets:</h2><br><br>
					<h3>Nothing<h3><br>
					<br>
					<h2 style='color:maroon'>Initial base gain:</h2><br><br>
					<span>min(ln([Death Points] + 1), 4)<span><br>
					<br>
					<h2 style='color:maroon'>Current base gain:</h2><br><br>
					<span>min(ln([Death Points] + 1), ${tmp.u.getBaseCap})${hasMilestone("r", 1) ? " + [Rads resets] / 5" : ""}<span><br>
					`
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
			description: "Add 5 to the Uranium base cap.",
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
			description: "Add 13 to the Uranium base cap.",
			cost() { return new Decimal(12595) },
			effect() { return 13 },
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
				const id = 11 + i % 5 + Math.floor(i / 5) * 10
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
    requires: new Decimal(1.35e5),
    resource: "Rads",
    baseResource: "Uranium",
    baseAmount() { return player.u.points },
    type: "normal",
    row: 1,
	displayRow: 0,
	exponent: 0.5,
	passiveGeneration() { return hasMilestone("r", 3) ? 1 : 0 },
    layerShown() { return player.r.unlocked || hasUpgrade("u", 35) },
	update(delta) {
		if (hasMilestone("r", 2)) player.r.times += delta
	},
	onPrestige() {
		if (hasMilestone("t", 0))
			player.r.times += 3
		else
			player.r.times++;
	},
	gainMult() {
		let gain = new Decimal(1)
		gain = gain.mul(tmp.t.effect)
		if (hasUpgrade("t", 15)) gain = gain.mul(upgradeEffect("t", 15))
		if (hasUpgrade("t", 25)) gain = gain.mul(upgradeEffect("t", 25))
		return gain
	},
	tabFormat: {
		Buyables: {
			content: [
				"main-display",
				"prestige-button",
				"blank",
				() => ["display-text", `You have ${formatWhole(player.u.points)} Uranium`],
				["blank", "50px"],
				"buyables",
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
		Info: {
			content: [
				() => ["raw-html",
					`<h1 style='color:red'>Information:</h1><br><br>
					<h2 style='color:maroon'>Initially resets:</h2><br><br>
					<h3>Death Points<h3><br>
					<h3>All Uranium layer content<h3><br>
					`
				],
			],
		},
	},
	buyables: {
		11: {
			cost(x) { return new Decimal(1) },
			display() { return `<h1 style='color:purple'>Mutation</h1><br><h2>Amount: ${getBuyableAmount("r", this.id)}/25</h2><br><br><h2>Per level add 1 to the Death Points base gain.</h2><br><br><h2>Currently: +${getBuyableAmount("r", this.id)}</h2>${getBuyableAmount("r", this.id) >= 25 ? "" : "<br><br><h2>Costs: 1 Rads</h2>"}` },
			canAfford() { return player.r.points.gte(this.cost()) },
			purchaseLimit: 25,
			buy() {
				player.r.points = player.r.points.sub(this.cost())
				addBuyables("r", this.id, 1)
			},
			style() { return { "width": "300px", "height": "300px" } },
		},
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
			effectDescription: "Every 5 Rads resets add 1 to the base Uranium gain. (Max: +40)",
			done() { return player.r.times >= 10 },
		},
		2: {
			requirementDescription: "25 Rads resets (3)",
			effectDescription: "Gain 1 Rads resets per second.",
			done() { return player.r.times >= 25 },
		},
		3: {
			requirementDescription: "50 Rads resets (4)",
			effectDescription: "Gain 100% of Rads per second.",
			done() { return player.r.times >= 50 },
		},
		4: {
			requirementDescription: "50 Rads (5)",
			effectDescription: "Unlock a new layer.",
			done() { return player.r.points.gte(50) },
			style() { return { "border-radius": "0 0 5px 5px" } },
		},
	},
	branches: [
		["t", function() { return player.r.unlocked ? "#65491c" : "#303030" }, 25],
	],
	doReset(layer) {
		if (layers[layer].row == this.row) return
		let keep = []
		const milestones = [...player.r.milestones]
		if (hasMilestone("t", 2)) keep.push("buyables")
		if (hasMilestone("t", 3)) keep.push("times")
		layerDataReset("r", keep)
		if (hasMilestone("t", 0)) {
			const c = player.t.milestones.length
			for (let i = 0; i < c; i++) {
				const id = i
				if (milestones.includes(id)) player.r.milestones.push(id)
			}
		}
	},
})

const GainCurrency = (c, g, d) => { c.best = c.best.max(c.points); let a = g.mul(d); c.total = c.total.add(a); c.points = c.points.add(a); }

addLayer("t", {
	name: "Toxins",
    symbol: "Tx",
    position: 0,
    startData() { return {
        unlocked: false,
		venom: { points: new Decimal(0), best: new Decimal(0), total: new Decimal(0) },
		chemicals: { points: new Decimal(0), best: new Decimal(0), total: new Decimal(0) },
		lp: { points: new Decimal(0), best: new Decimal(0), total: new Decimal(0) },
		hp: { points: new Decimal(0), best: new Decimal(0), total: new Decimal(0) },
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
		times: 0,
    } },
	requires: new Decimal(100),
    resource: "Toxins",
    baseResource: "Rads",
    baseAmount() { return player.r.points },
    color: "#666111",
	colors: { venom: "#340b6e", chemicals: "#6e6e6e", },
    type: "static",
    row: 2,
	displayRow: 2,
	exponent: 2.475,
	base: 500,
	effectDescription() { return `multiplying Rads gain by x${formatWhole(tmp.t.effect)}` },
	effect() {
		let eff = new Decimal(1)
		eff = eff.mul(new Decimal(2).pow(player.t.points))
		return eff
	},
    layerShown() { return hasMilestone("r", 4) || player.t.unlocked },
	update(delta) {
		player.t.venom.best = player.t.venom.best.max(player.t.venom.points)
		player.t.chemicals.best = player.t.chemicals.best.max(player.t.chemicals.points)
		player.t.lp.best = player.t.lp.best.max(player.t.lp.points)
		player.t.hp.best = player.t.hp.best.max(player.t.hp.points)
		player.t.venom.points = player.t.venom.points.add(tmp.t.proVenom.gain.mul(delta))

		if (getClickableState("t", 11) == "") {
			player.t.chemicals.points = player.t.chemicals.points.add(tmp.t.proChemicals.gain.mul(delta))
		} else {
			let amount = tmp.t.filtering.filter.mul(delta)
			if (amount.gt(player.t.chemicals.points)) {
				amount = player.t.chemicals.points
			}
			player.t.lp.points = player.t.lp.points.add(amount.mul(tmp.t.filtering.lpGain))
			player.t.hp.points = player.t.hp.points.add(amount.mul(tmp.t.filtering.hpGain))
			player.t.chemicals.points = player.t.chemicals.points.sub(amount)
		}
		player.t.chemicals.points = player.t.chemicals.points.min(tmp.t.proChemicals.cap)
		player.t.lp.points = player.t.lp.points.min(tmp.t.filtering.lpCap)
		player.t.hp.points = player.t.hp.points.min(tmp.t.filtering.hpCap)
	},
	onPrestige() {
		player.t.times++;
	},
	production() {
		let gain = new Decimal(10)
		if (player.t.unlocked) gain = gain.pow(player.t.points.sub(1)).max(0)
		return gain
	},
	proVenom : {
		unlocked() {
			return hasMilestone("t", 0)
		},
		can() {
			return player.t.points.gte(1) && hasMilestone("r", 4)
		},
		base() {
			let base = new Decimal(1)

			base = base.add(buyableEffect("t", 12))
			base = base.mul(tmp.t.production)
			base = base.pow(buyableEffect("t", 13))

			if (tmp.t.proVenom.can)
				return base
			return new Decimal(0)
		},
		gain() {
			let gain = tmp.t.proVenom.base
			gain = gain.mul(buyableEffect("t", 11))
			if (hasUpgrade("t", 21)) gain = gain.mul(upgradeEffect("t", 21))
			if (hasUpgrade("t", 23)) gain = gain.mul(upgradeEffect("t", 23))
			if (hasUpgrade("t", 14)) gain = gain.pow(upgradeEffect("t", 14))
			return gain
		},
	},
	proChemicals : {
		unlocked() {
			return hasMilestone("t", 3)
		},
		can() {
			return player.t.points.gte(3) && hasMilestone("t", 3) && hasUpgrade("t", 25) && getClickableState("t", 11) == ""
		},
		base() {
			let base = new Decimal(1)
			base = base.mul(tmp.t.production.div(100))

			if (tmp.t.proChemicals.can)
				return base
			return new Decimal(0)
		},
		gain() {
			let gain = tmp.t.proChemicals.base
			return gain
		},
		cap() {
			let cap = new Decimal(100)
			cap = cap.mul(buyableEffect("t", 23))
			return cap
		},
	},
	filtering : {
		filter() {
			let gain = new Decimal(1)
			if (getClickableState("t", 11) == "") gain = new Decimal(0)
			return gain
		},
		lpGain() {
			let gain = new Decimal(1)
			gain = gain.mul(buyableEffect("t", 31))
			return gain
		},
		hpGain() {
			let gain = new Decimal(1)
			gain = gain.mul(buyableEffect("t", 32))
			return gain
		},
		lpCap() {
			let cap = new Decimal(10)
			cap = cap.mul(buyableEffect("t", 21))
			return cap
		},
		hpCap() {
			let cap = new Decimal(10)
			cap = cap.mul(buyableEffect("t", 22))
			return cap
		},
	},
	tabFormat: {
		Main: {
			content: [
				"main-display",
				"prestige-button",
				"blank",
				() => ["display-text", `You have done ${formatWhole(player.t.times)} Toxins resets`],
				() => ["display-text", `You have ${formatWhole(player.r.points)} Rads`],
				"blank",
				"milestones",
			]
		},
		Production: {
			content: [
				"main-display",
				["display-text", "<span style='color:yellow'>Note: All production content is reset on Toxins resets initially</span>"],
				"blank",
				() => ["display-text", `Your base production is ${tmp.t.production}/s`],
				"blank",
				() => ["display-text", `<span id='pro-venom'></span>You have ${GlowText("h2", format(player.t.venom.points), tmp.t.colors.venom)} Venom`],
				["display-text", "(Requires: 1+ Toxins & Rads milestone 5)"],
				"blank",
				() => ["display-text", `You are gaining ${format(tmp.t.proVenom.gain)} Venom per second`],
				"blank",
				["display-text", "<a href='#upg-production' style='color:white'>(Goto upgrades)</a>"],
				"blank",
				["buyables", [1]],
				() => hasUpgrade("t", 31) ? ["column", [
					"blank",
					["buyables", [2]],
				]] : "",
				["blank", "50px"],
				() => tmp.t.proChemicals.unlocked ? ["column", [
					["display-text", `<span id='pro-chem'></span>You have ${GlowText("h2", format(player.t.chemicals.points), tmp.t.colors.chemicals)} Chemicals`],
					["display-text", "(Requires: 3+ Toxins & Toxins milestone 4 & Venom X)"],
					["display-text", "(Chemicals gain base is [base production] / 100)"],
					"blank",
					["display-text", `You are gaining ${format(tmp.t.proChemicals.gain)} Chemicals per second`],
					["display-text", `Your Chemicals cap is ${format(tmp.t.proChemicals.cap)}`],
					"blank",
					["display-text", "<a href='#upg-production' style='color:white'>(Goto upgrades)</a>"],
					"blank",
					"clickables",
					"blank",
					["display-text", "Capacity"],
					["bar", "cap"],
					"blank",
					["column", [
						["row", [
							["display-text", "Lethal Points"],
							["blank", ["50px", "50px"]],
							["display-text", "Healthy Points"],
						]],
						"blank",
						["row", [
							["bar", "lp"],
							["blank", ["50px", "50px"]],
							["bar", "hp"],
						]],
					]],
					"blank",
					["display-text", `You are filtering ${format(tmp.t.filtering.filter)} Chemicals per second`],
					["display-text", `You are getting x${format(tmp.t.filtering.lpGain)} Lethal Points`],
					["display-text", `You are getting x${format(tmp.t.filtering.hpGain)} Healthy Points`],
					"blank",
					["buyables", [3]],
				]] : "",
				["blank", "50px"],
				() => hasMilestone("t", 1) ? ["column", [
					["display-text", "<h2 id='upg-production'>Upgrades</h2>"],
					"blank",
					["display-text", "<a href='#pro-venom' style='color:white'>- Venom</a>"],
					tmp.t.proChemicals.unlocked ? ["display-text", "<a href='#pro-chem' style='color:white'>- Chemicals</a>"] : "",
					"blank",
					["microtabs", "upgrades"],
				]] : "",
			],
			unlocked() { hasMilestone("t", 0) },
		},
		Info: {
			content: [
				() => ["raw-html",
					`<h1 style='color:red'>Information:</h1><br><br>
					<h2 style='color:maroon'>Initially resets:</h2><br><br>
					<h3>Death Points<h3><br>
					<h3>All Uranium layer content<h3><br>
					<h3>All Rads layer content<h3><br>
					<br>
					<h2 style='color:maroon'>Info:</h2><br><br>
					<span>You only produce things when you meet the requirement for them.<span><br>
					<br>
					<h2 style='color:maroon'>Initial base production:</h2><br><br>
					<span>max(10 ^ ([Toxins] - 1), 0)<span><br>
					<br>
					<h2 style='color:maroon'>Current base production:</h2><br><br>
					<span>max(10 ^ ([Toxins] - 1), 0)<span><br>
					`
				],
			],
		},
	},
	microtabs: {
		upgrades: {
			Venom: {
				content: [
					["upgrades", [1, 2, 3]],
				],
				unlocked() { return hasMilestone("t", 1) },
			},
			Chemicals: {
				content: [
					["upgrades", [4]],
				],
				unlocked() { return tmp.t.proChemicals.unlocked },
			},
		},
	},
	bars: {
		cap: {
			direction: RIGHT,
			width: 600,
			height: 50,
			display() {
				return `${format(player.t.chemicals.points)} / ${format(tmp.t.proChemicals.cap)} (${format(this.progress().mul(100).min(100).max(0))}%)`
			},
			progress() { return player.t.chemicals.points.div(tmp.t.proChemicals.cap) },
			fillStyle() { return { "background": tmp.t.colors.chemicals } },
		},
		lp: {
			direction: UP,
			width: 100,
			height: 200,
			display() {
				return `${format(player.t.lp.points)}<br>/<br>${format(tmp.t.filtering.lpCap)}<br><br>(${format(this.progress().mul(100).min(100).max(0))}%)`
			},
			progress() { return player.t.lp.points.div(tmp.t.filtering.lpCap) },
			fillStyle() { return { "background": "darkred" } },
		},
		hp: {
			direction: UP,
			width: 100,
			height: 200,
			display() {
				return `${format(player.t.hp.points)}<br>/<br>${format(tmp.t.filtering.hpCap)}<br><br>(${format(this.progress().mul(100).min(100).max(0))}%)`
			},
			progress() { return player.t.hp.points.div(tmp.t.filtering.hpCap) },
			fillStyle() { return { "background": "darkOliveGreen" } },
		},
	},
	clickables: {
		11: {
			title() { return getClickableState("t", this.id) == "" ? "<h2 style='color:cornflowerBlue'>Produce</h2><br>" : "<h2 style='color:cornflowerBlue'>Filter</h2><br>" },
			display() {
				return getClickableState("t", this.id) == "" ?
					`<h3 style='color:limeGreen'>Gain Chemicals.</h3><br><br><h3 style='color:darkRed'>But can't filter it.</h3>` :
					`<h3 style='color:limeGreen'>Filter Chemicals.</h3><br><br><h3 style='color:darkRed'>But can't gain it.</h3>`
			},
			effect() { return getClickableState("t", this.id) == "" ? true : false },
			onClick() { getClickableState("t", this.id) == "" ? setClickableState("t", this.id, "f") : setClickableState("t", this.id, "") },
			canClick() { return true },
			style() { return { "width": "300px", "height": "75px", "border-radius": "10px" } },
		},
	},
	buyables: {
		11: {
			cost(x) { return new Decimal(2).mul(new Decimal(1.1).pow(x.pow(2))) },
			effect(x) {
				let base = new Decimal(2)
				if (hasUpgrade("t", 13)) base = new Decimal(2.5)
				return base.pow(x.add(this.extra()))
			},
			display() { return `<h1 style='color:${tmp.t.colors.venom}'>Venom Gain</h1><br><br><h2>Amount: ${formatWhole(getBuyableAmount("t", this.id))} + ${formatWhole(this.extra())}</h2><br><br><h2>Increases Venom gain.</h2><br><br><h2>Currently:<br>*${format(buyableEffect("t", this.id))}</h2><br><br><h2>Costs:<br>${format(this.cost())} Venom</h2>` },
			canAfford() { return player.t.venom.points.gte(this.cost()) },
			buy() {
				player.t.venom.points = player.t.venom.points.sub(this.cost())
				addBuyables("t", this.id, 1)
			},
			extra() { return getBuyableAmount("t", 12).add(tmp.t.buyables[12].extra) },
			style() { return { "width": "200px", "height": "300px", "border-radius": (tmp.t.buyables[12].unlocked ? "10px 0 0 10px" : "10px") } },
		},
		12: {
			cost(x) { return new Decimal(1e4).mul(new Decimal(1.2).pow(x.pow(2))) },
			effect(x) {
				let base = new Decimal(1.5)
				if (hasUpgrade("t", 12)) base = new Decimal(4)
				return base.pow(x.add(this.extra())).sub(1)
			},
			display() { return `<h1 style='color:${tmp.t.colors.venom}'>Venom Base</h1><br><br><h2>Amount: ${formatWhole(getBuyableAmount("t", this.id))} + ${formatWhole(this.extra())}</h2><br><br><h2>Increases Venom base.</h2><br><br><h2>Currently:<br>+${format(buyableEffect("t", this.id))}</h2><br><br><h2>Costs:<br>${format(this.cost())} Venom</h2>` },
			canAfford() { return player.t.venom.points.gte(this.cost()) },
			buy() {
				player.t.venom.points = player.t.venom.points.sub(this.cost())
				addBuyables("t", this.id, 1)
			},
			extra() { return getBuyableAmount("t", 13).add(tmp.t.buyables[13].extra) },
			unlocked() { return getBuyableAmount("t", 11).gte(10) },
			style() { return { "width": "200px", "height": "300px", "border-radius": (tmp.t.buyables[13].unlocked ? "0" : "0 10px 10px 0") } },
		},
		13: {
			cost(x) {
				if (hasUpgrade("t", 11))
					return new Decimal(1.25).pow(x.pow(2))
				return new Decimal(5e10).mul(new Decimal(1.25).pow(x.pow(2)))
			},
			effect(x) { return new Decimal(1.01).pow(x.add(this.extra())) },
			display() { return `<h1 style='color:${tmp.t.colors.venom}'>Venom Power</h1><br><br><h2>Amount: ${formatWhole(getBuyableAmount("t", this.id))} + ${formatWhole(this.extra())}</h2><br><br><h2>Increases Venom power.</h2><br><br><h2>Currently:<br>^${format(buyableEffect("t", this.id))}</h2><br><br><h2>Costs:<br>${format(this.cost())} Venom</h2>` },
			canAfford() { return player.t.venom.points.gte(this.cost()) },
			buy() {
				player.t.venom.points = player.t.venom.points.sub(this.cost())
				addBuyables("t", this.id, 1)
			},
			extra() { return new Decimal(0) },
			unlocked() { return getBuyableAmount("t", 12).gte(10) },
			style() { return { "width": "200px", "height": "300px", "border-radius": "0 10px 10px 0" } },
		},
		21: {
			cost(x) { return new Decimal(1e200).mul(new Decimal(20).pow(x.pow(2))) },
			effect(x) { return new Decimal(1.5).pow(x.add(this.extra())) },
			display() { return `<h1 style='color:${tmp.t.colors.chemicals}'>Lethal Cap</h1><br><br><h2>Amount: ${formatWhole(getBuyableAmount("t", this.id))} + ${formatWhole(this.extra())}</h2><br><br><h2>Increases Lethal Points cap.</h2><br><br><h2>Currently:<br>*${format(buyableEffect("t", this.id))}</h2><br><br><h2>Costs:<br>${format(this.cost())} Venom</h2>` },
			canAfford() { return player.t.venom.points.gte(this.cost()) },
			buy() {
				player.t.venom.points = player.t.venom.points.sub(this.cost())
				addBuyables("t", this.id, 1)
			},
			extra() { return new Decimal(0) },
			unlocked() { return hasUpgrade("t", 31) },
			style() { return { "width": "200px", "height": "300px", "border-radius": "10px 0 0 10px" } },
		},
		22: {
			cost(x) { return new Decimal(1e200).mul(new Decimal(20).pow(x.pow(2))) },
			effect(x) { return new Decimal(1.5).pow(x.add(this.extra())) },
			display() { return `<h1 style='color:${tmp.t.colors.chemicals}'>Healthy Cap</h1><br><br><h2>Amount: ${formatWhole(getBuyableAmount("t", this.id))} + ${formatWhole(this.extra())}</h2><br><br><h2>Increases Healthy Points cap.</h2><br><br><h2>Currently:<br>*${format(buyableEffect("t", this.id))}</h2><br><br><h2>Costs:<br>${format(this.cost())} Venom</h2>` },
			canAfford() { return player.t.venom.points.gte(this.cost()) },
			buy() {
				player.t.venom.points = player.t.venom.points.sub(this.cost())
				addBuyables("t", this.id, 1)
			},
			extra() { return new Decimal(0) },
			unlocked() { return hasUpgrade("t", 31) },
			style() { return { "width": "200px", "height": "300px", "border-radius": "0" } },
		},
		23: {
			cost(x) { return new Decimal(1e200).mul(new Decimal(1.5).pow(x.pow(2))) },
			effect(x) { return new Decimal(1.1).pow(x.add(this.extra())) },
			display() { return `<h1 style='color:${tmp.t.colors.chemicals}'>Chemical Cap</h1><br><br><h2>Amount: ${formatWhole(getBuyableAmount("t", this.id))} + ${formatWhole(this.extra())}</h2><br><br><h2>Increases Chemicals cap.</h2><br><br><h2>Currently:<br>*${format(buyableEffect("t", this.id))}</h2><br><br><h2>Costs:<br>${format(this.cost())} Venom</h2>` },
			canAfford() { return player.t.venom.points.gte(this.cost()) },
			buy() {
				player.t.venom.points = player.t.venom.points.sub(this.cost())
				addBuyables("t", this.id, 1)
			},
			extra() { return new Decimal(0) },
			unlocked() { return hasUpgrade("t", 31) },
			style() { return { "width": "200px", "height": "300px", "border-radius": "0 10px 10px 0" } },
		},
		31: {
			cost(x) { return new Decimal(10).mul(new Decimal(1.01).pow(x.pow(2))) },
			effect(x) { return new Decimal(1.2).pow(x.add(this.extra())) },
			display() { return `<h1 style='color:${tmp.t.colors.chemicals}'>Lethal Gain</h1><br><br><h2>Amount: ${formatWhole(getBuyableAmount("t", this.id))} + ${formatWhole(this.extra())}</h2><br><br><h2>Increases Lethal Points gain.</h2><br><br><h2>Currently:<br>*${format(buyableEffect("t", this.id))}</h2><br><br><h2>Costs:<br>${format(this.cost())} LP</h2>` },
			canAfford() { return player.t.lp.points.gte(this.cost()) },
			buy() {
				player.t.lp.points = player.t.lp.points.sub(this.cost())
				addBuyables("t", this.id, 1)
			},
			extra() { return new Decimal(0) },
			unlocked() { return hasUpgrade("t", 42) },
			style() { return { "width": "200px", "height": "300px", "border-radius": "10px 0 0 10px" } },
		},
		32: {
			cost(x) { return new Decimal(10).mul(new Decimal(1.01).pow(x.pow(2))) },
			effect(x) { return new Decimal(1.15).pow(x.add(this.extra())) },
			display() { return `<h1 style='color:${tmp.t.colors.chemicals}'>Healthy Gain</h1><br><br><h2>Amount: ${formatWhole(getBuyableAmount("t", this.id))} + ${formatWhole(this.extra())}</h2><br><br><h2>Increases Healthy Points gain.</h2><br><br><h2>Currently:<br>*${format(buyableEffect("t", this.id))}</h2><br><br><h2>Costs:<br>${format(this.cost())} HP</h2>` },
			canAfford() { return player.t.hp.points.gte(this.cost()) },
			buy() {
				player.t.hp.points = player.t.hp.points.sub(this.cost())
				addBuyables("t", this.id, 1)
			},
			extra() { return new Decimal(0) },
			unlocked() { return hasUpgrade("t", 42) },
			style() { return { "width": "200px", "height": "300px", "border-radius": "0 10px 10px 0" } },
		},
	},
	upgrades: {
		11: {
			title: "Venom I",
			description: "Remove Venom Power base cost.",
			currencyLocation() { return player.t.venom },
			currencyInternalName: "points",
			currencyDisplayName: "Venom",
			cost() { return new Decimal(1e20) },
			unlocked() { return hasMilestone("t", 1) },
			style() {
				let s = {}
				s["border-radius"] = "10px"
				if (tmp.t.upgrades["12"].unlocked) s["border-radius"] = "10px 0 0 10px"
				if (tmp.t.upgrades["25"].unlocked) s["border-radius"] = "10px 0 0 0"
				return s
			},
		},
		12: {
			title: "Venom II",
			description: "Venom Base base becomes 4  instead of 1.5.",
			currencyLocation() { return player.t.venom },
			currencyInternalName: "points",
			currencyDisplayName: "Venom",
			cost() { return new Decimal(5e26) },
			unlocked() { return hasUpgrade("t", 11) },
			style() {
				let s = {}
				s["border-radius"] = "0 10px 10px 0"
				if (tmp.t.upgrades["13"].unlocked) s["border-radius"] = "0"
				return s
			},
		},
		13: {
			title: "Venom III",
			description: "Venom Gain base becomes 2.5 instead of 2.",
			currencyLocation() { return player.t.venom },
			currencyInternalName: "points",
			currencyDisplayName: "Venom",
			cost() { return new Decimal(1e84) },
			unlocked() { return hasUpgrade("t", 12) },
			style() {
				let s = {}
				s["border-radius"] = "0 10px 10px 0"
				if (tmp.t.upgrades["14"].unlocked) s["border-radius"] = "0"
				return s
			},
		},
		14: {
			title: "Venom IV",
			description: "Raise Venom gain by 1.1.",
			currencyLocation() { return player.t.venom },
			currencyInternalName: "points",
			currencyDisplayName: "Venom",
			effect() { return new Decimal(1.1) },
			cost() { return new Decimal(2.5e110) },
			unlocked() { return hasUpgrade("t", 13) },
			style() {
				let s = {}
				s["border-radius"] = "0 10px 10px 0"
				if (tmp.t.upgrades["15"].unlocked) s["border-radius"] = "0"
				return s
			},
		},
		15: {
			title: "Venom V",
			description: "Venom boosts Rads gain.",
			currencyLocation() { return player.t.venom },
			currencyInternalName: "points",
			currencyDisplayName: "Venom",
			effect() { return player.t.venom.points.add(1).log2() },
			effectDisplay() { return `x${format(this.effect())}` },
			cost() { return new Decimal(1e139) },
			unlocked() { return hasUpgrade("t", 14) },
			style() {
				let s = {}
				s["border-radius"] = "0 10px 10px 0"
				if (tmp.t.upgrades["25"].unlocked) s["border-radius"] = "0 10px 0 0"
				return s
			},
		},
		21: {
			title: "Venom VI",
			description: "Uranium boosts Venom gain.",
			currencyLocation() { return player.t.venom },
			currencyInternalName: "points",
			currencyDisplayName: "Venom",
			effect() { return player.u.points.add(1) },
			effectDisplay() { return `x${format(this.effect())}` },
			cost() { return new Decimal(1e143) },
			unlocked() { return hasMilestone("t", 2) && hasUpgrade("t", 15) },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 10px"
				if (tmp.t.upgrades["22"].unlocked) s["border-radius"] = "0 0 0 10px"
				return s
			},
		},
		22: {
			title: "Venom VII",
			description: "Venom boosts Uranium gain.",
			currencyLocation() { return player.t.venom },
			currencyInternalName: "points",
			currencyDisplayName: "Venom",
			effect() { return player.t.venom.points.add(1).log2() },
			effectDisplay() { return `x${format(this.effect())}` },
			cost() { return new Decimal(5e160) },
			unlocked() { return hasUpgrade("t", 21) },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 0"
				if (tmp.t.upgrades["23"].unlocked) s["border-radius"] = "0"
				return s
			},
		},
		23: {
			title: "Venom VIII",
			description: "Death Points boosts Venom gain. (Max: x1.00e20)",
			currencyLocation() { return player.t.venom },
			currencyInternalName: "points",
			currencyDisplayName: "Venom",
			effect() { return player.points.add(1).min(1e20) },
			effectDisplay() { return `x${format(this.effect())}` },
			cost() { return new Decimal(1e168) },
			unlocked() { return hasUpgrade("t", 22) },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 0"
				if (tmp.t.upgrades["24"].unlocked) s["border-radius"] = "0"
				return s
			},
		},
		24: {
			title: "Venom IX",
			description: "Multiply Death Points gain by 1,000",
			currencyLocation() { return player.t.venom },
			currencyInternalName: "points",
			currencyDisplayName: "Venom",
			effect() { return new Decimal(1000) },
			cost() { return new Decimal(2.5e209) },
			unlocked() { return hasUpgrade("t", 23) },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 0"
				if (tmp.t.upgrades["25"].unlocked) s["border-radius"] = "0"
				return s
			},
		},
		25: {
			title: "Venom X",
			description: "Multiply Rads gain by 1.00e10",
			currencyLocation() { return player.t.venom },
			currencyInternalName: "points",
			currencyDisplayName: "Venom",
			effect() { return new Decimal(1e10) },
			cost() { return new Decimal(5e217) },
			unlocked() { return hasUpgrade("t", 24) },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 0"
				//if (tmp.t.upgrades["24"].unlocked) s["border-radius"] = "0"
				return s
			},
		},
		31: {
			title: "Venom XI",
			description: "Unlock more Venom buyables",
			currencyLocation() { return player.t.venom },
			currencyInternalName: "points",
			currencyDisplayName: "Venom",
			cost() { return new Decimal(1e220) },
			unlocked() { return hasUpgrade("t", 25) && hasUpgrade("t", 41) },
			style() {
				let s = {}
				s["border-radius"] = "0 0 10px 10px"
				//if (tmp.t.upgrades["24"].unlocked) s["border-radius"] = "0"
				return s
			},
		},
		41: {
			title: "Chemical I",
			description: "Unlock another row of Venom upgrades",
			currencyLocation() { return player.t.lp },
			currencyInternalName: "points",
			currencyDisplayName: "LP",
			cost() { return new Decimal(10) },
			unlocked() { return tmp.t.proChemicals.unlocked },
			style() {
				let s = {}
				s["border-radius"] = "10px 10px 10px 10px"
				if (tmp.t.upgrades["42"].unlocked) s["border-radius"] = "10px 0 0 10px"
				return s
			},
		},
		42: {
			title: "Chemical II",
			description: "Unlock Chemical buyables",
			currencyLocation() { return player.t.hp },
			currencyInternalName: "points",
			currencyDisplayName: "HP",
			cost() { return new Decimal(10) },
			unlocked() { return hasUpgrade("t", 41) },
			style() {
				let s = {}
				s["border-radius"] = "0 10px 10px 0"
				//if (tmp.t.upgrades["43"].unlocked) s["border-radius"] = "0"
				return s
			},
		},
	},
	milestones: {
		0: {
			requirementDescription: "1 Toxins (1)",
			effectDescription: "Keep a Rads milestone per Toxins milestone, gain x3 Rads resets, unlock one new tabs and unlock Venom.",
			done() { return player.t.points.gte(1) },
			style() { return { "border-radius": "5px 5px 0 0" } },
		},
		1: {
			requirementDescription: "10 Venom Power amount (2)",
			effectDescription: "Unlock Venom upgrades.",
			done() { return getBuyableAmount("t", 13).gte(10) },
			style() { return { "border-radius": "0" } },
		},
		2: {
			requirementDescription: "2 Toxins (3)",
			effectDescription: "Keep Rads buyables on reset.",
			done() { return player.t.points.gte(2) },
			style() { return { "border-radius": "0" } },
		},
		3: {
			requirementDescription: "3 Toxins (4)",
			effectDescription: "Unlock Chemicals and keep Rads resets.",
			done() { return player.t.points.gte(3) },
			style() { return { "border-radius": "0 0 5px 5px" } },
		},
	},
	doReset(layer) {
		if (layers[layer].row == this.row && layer != "t") return
		let keep = ["points", "milestones", "times", "best", "total"]
		layerDataReset("t", keep)
	},
})

const achData = [
	{ Name: "The Beginning", Color: "lime", Rows: [1, 2, 3], Unlocked: () => true, Id: "beginning", },
	{ Name: "Mutation", Color: "purple", Rows: [4], Unlocked: () => player.r.unlocked, Id: "mutation", },
	{ Name: "Toxicity", Color: "darkgoldenrod", Rows: [5, 6, 7, 8, 9, 10, 11], Unlocked: () => player.t.unlocked, Id: "toxic", },
]

const achNumberData = [
	{
		1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight", 9: "Nine",
		10: "Ten", 11: "Eleven", 12: "Twelve", 13: "Thirteen", 14: "Fourteen", 15: "Fifteen", 16: "Sixteen", 17: "Seventeen", 18: "Eighteen", 19: "Nineteen",
	},
	{ 20: "Twenty", 30: "Thirty", 40: "Forty", 50: "Fifty", 60: "Sixty", 70: "Seventy", 80: "Eighty", 90: "Ninety", },
]

const achNumber = (n) => n < 20 ? achNumberData[0][n] : `${achNumberData[1][n - n % 10]}${n % 10 == 0 ? "" : `-${achNumberData[0][n % 10]}`}`

const Achievement = (n, d, t = "", s = "0px") => { return { name: achNumber(n), done: d, tooltip: t, unlocked: true, style() { return { "border-radius": s, } } } }

const achInfo = [
	// C1 : 1 - 3
	{ Done: () => player.points.gte(1)                , Tool: "Get 1 Death Points"       , Style: "10px 0 0 0"    , },
	{ Done: () => player.points.gte(10)               , Tool: "Get 10 Death Points"      , Style: "0"             , },
	{ Done: () => player.points.gte(100)              , Tool: "Get 100 Death Points"     , Style: "0"             , },
	{ Done: () => player.points.gte(500)              , Tool: "Get 500 Death Points"     , Style: "0"             , },
	{ Done: () => player.points.gte(1e3)              , Tool: "Get 1,000 Death Points"   , Style: "0"             , },
	{ Done: () => player.points.gte(2e3)              , Tool: "Get 2,000 Death Points"   , Style: "0"             , },
	{ Done: () => player.points.gte(3e3)              , Tool: "Get 3,000 Death Points"   , Style: "0 10px 0 0"    , },

	{ Done: () => player.u.points.gte(1)              , Tool: "Get 1 Uranium"            , Style: "0"             , },
	{ Done: () => player.u.points.gte(5)              , Tool: "Get 5 Uranium"            , Style: "0"             , },
	{ Done: () => player.u.points.gte(10)             , Tool: "Get 10 Uranium"           , Style: "0"             , },
	{ Done: () => player.u.points.gte(15)             , Tool: "Get 15 Uranium"           , Style: "0"             , },
	{ Done: () => player.u.points.gte(100)            , Tool: "Get 100 Uranium"          , Style: "0"             , },
	{ Done: () => player.u.points.gte(300)            , Tool: "Get 300 Uranium"          , Style: "0"             , },
	{ Done: () => player.u.points.gte(400)            , Tool: "Get 400 Uranium"          , Style: "0"             , },

	{ Done: () => player.u.points.gte(1e3)            , Tool: "Get 1,000 Uranium"        , Style: "0 0 0 10px"    , },
	{ Done: () => player.u.points.gte(2e3)            , Tool: "Get 2,000 Uranium"        , Style: "0"             , },
	{ Done: () => player.u.points.gte(3e3)            , Tool: "Get 3,000 Uranium"        , Style: "0"             , },
	{ Done: () => player.u.points.gte(4e3)            , Tool: "Get 4,000 Uranium"        , Style: "0"             , },
	{ Done: () => player.u.points.gte(8e3)            , Tool: "Get 8,000 Uranium"        , Style: "0"             , },
	{ Done: () => player.u.points.gte(1.5e4)          , Tool: "Get 15,000 Uranium"       , Style: "0"             , },
	{ Done: () => player.u.points.gte(1.7e4)          , Tool: "Get 17,000 Uranium"       , Style: "0 0 10px 0"    , },

	// C2 4 - 4
	{ Done: () => player.r.times >= 1                 , Tool: "Get 1 Rads resets"        , Style: "10px 0 0 10px" , },
	{ Done: () => player.r.times >= 5                 , Tool: "Get 5 Rads resets"        , Style: "0"             , },
	{ Done: () => player.r.times >= 10                , Tool: "Get 10 Rads resets"       , Style: "0"             , },
	{ Done: () => player.r.times >= 15                , Tool: "Get 15 Rads resets"       , Style: "0"             , },
	{ Done: () => player.r.times >= 20                , Tool: "Get 20 Rads resets"       , Style: "0"             , },
	{ Done: () => player.r.times >= 25                , Tool: "Get 25 Rads resets"       , Style: "0"             , },
	{ Done: () => player.r.times >= 100               , Tool: "Get 100 Rads resets"      , Style: "0 10px 10px 0" , },

	// C3 5 - 11
	{ Done: () => player.t.times >= 1                 , Tool: "Get 1 Toxins resets"      , Style: "10px 0 0 0"    , },
	{ Done: () => player.t.times >= 2                 , Tool: "Get 2 Toxins resets"      , Style: "0"             , },
	{ Done: () => player.t.times >= 3                 , Tool: "Get 3 Toxins resets"      , Style: "0"             , },
	{ Done: () => player.t.times >= 4                 , Tool: "Get 4 Toxins resets"      , Style: "0"             , },
	{ Done: () => player.t.times >= 5                 , Tool: "Get 5 Toxins resets"      , Style: "0"             , },
	{ Done: () => player.t.times >= 6                 , Tool: "Get 6 Toxins resets"      , Style: "0"             , },
	{ Done: () => player.t.times >= 7                 , Tool: "Get 7 Toxins resets"      , Style: "0 10px 0 0"    , },

	{ Done: () => player.t.venom.points.gte(1)        , Tool: "Get 1 Venom"              , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte(100)      , Tool: "Get 100 Venom"            , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte(1e4)      , Tool: "Get 10,000 Venom"         , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte(1e6)      , Tool: "Get 1,000,000 Venom"      , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte(1e8)      , Tool: "Get 100,000,000 Venom"    , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte(1e10)     , Tool: "Get 1.00e10 Venom"        , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte(1e12)     , Tool: "Get 1.00e12 Venom"        , Style: "0"             , },

	{ Done: () => player.t.venom.points.gte(1e20)     , Tool: "Get 1.00e20 Venom"        , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte(1e40)     , Tool: "Get 1.00e40 Venom"        , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte(1e60)     , Tool: "Get 1.00e60 Venom"        , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte(1e80)     , Tool: "Get 1.00e80 Venom"        , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte(1e100)    , Tool: "Get 1.00e100 Venom"       , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte(1e120)    , Tool: "Get 1.00e120 Venom"       , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte(1e140)    , Tool: "Get 1.00e140 Venom"       , Style: "0"             , },

	{ Done: () => player.t.venom.points.gte(1e200)    , Tool: "Get 1.00e200 Venom"       , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte("1e400")  , Tool: "Get 1.00e400 Venom"       , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte("1e600")  , Tool: "Get 1.00e600 Venom"       , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte("1e800")  , Tool: "Get 1.00e800 Venom"       , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte("1e1000") , Tool: "Get 1.00e1,000 Venom"     , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte("1e1200") , Tool: "Get 1.00e1,200 Venom"     , Style: "0"             , },
	{ Done: () => player.t.venom.points.gte("1e1400") , Tool: "Get 1.00e1,400 Venom"     , Style: "0"             , },

	{ Done: () => player.t.chemicals.points.gte(1)    , Tool: "Get 1 Chemicals"          , Style: "0"             , },
	{ Done: () => player.t.chemicals.points.gte(10)   , Tool: "Get 10 Chemicals"         , Style: "0"             , },
	{ Done: () => player.t.chemicals.points.gte(100)  , Tool: "Get 100 Chemicals"        , Style: "0"             , },
	{ Done: () => player.t.chemicals.points.gte(1e3)  , Tool: "Get 1,000 Chemicals"      , Style: "0"             , },
	{ Done: () => player.t.chemicals.points.gte(1e4)  , Tool: "Get 10,000 Chemicals"     , Style: "0"             , },
	{ Done: () => player.t.chemicals.points.gte(1e5)  , Tool: "Get 100,000 Chemicals"    , Style: "0"             , },
	{ Done: () => player.t.chemicals.points.gte(1e6)  , Tool: "Get 1,000,000 Chemicals"  , Style: "0"             , },

	{ Done: () => player.t.lp.points.gte(1)           , Tool: "Get 1 Lethal Points"      , Style: "0"             , },
	{ Done: () => player.t.lp.points.gte(4)           , Tool: "Get 4 Lethal Points"      , Style: "0"             , },
	{ Done: () => player.t.lp.points.gte(16)          , Tool: "Get 16 Lethal Points"     , Style: "0"             , },
	{ Done: () => player.t.lp.points.gte(64)          , Tool: "Get 64 Lethal Points"     , Style: "0"             , },
	{ Done: () => player.t.lp.points.gte(256)         , Tool: "Get 256 Lethal Points"    , Style: "0"             , },
	{ Done: () => player.t.lp.points.gte(1e3)         , Tool: "Get 1,000 Lethal Points"  , Style: "0"             , },
	{ Done: () => player.t.lp.points.gte(2e3)         , Tool: "Get 2,000 Lethal Points"  , Style: "0"             , },

	{ Done: () => player.t.hp.points.gte(1)           , Tool: "Get 1 Healthy Points"     , Style: "0 0 0 10px"    , },
	{ Done: () => player.t.hp.points.gte(4)           , Tool: "Get 4 Healthy Points"     , Style: "0"             , },
	{ Done: () => player.t.hp.points.gte(16)          , Tool: "Get 16 Healthy Points"    , Style: "0"             , },
	{ Done: () => player.t.hp.points.gte(64)          , Tool: "Get 64 Healthy Points"    , Style: "0"             , },
	{ Done: () => player.t.hp.points.gte(256)         , Tool: "Get 256 Healthy Points"   , Style: "0"             , },
	{ Done: () => player.t.hp.points.gte(1e3)         , Tool: "Get 1,000 Healthy Points" , Style: "0"             , },
	{ Done: () => player.t.hp.points.gte(2e3)         , Tool: "Get 2,000 Healthy Points" , Style: "0 0 10px 0"    , },
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
		["display-text", "<h1 id='ach-achievements'>Achievements</h1>"],
		"blank",
		() => {
			let data = ["column", []]

			data[1].push(["display-text", "<h2 style='color:#03d3fc'>Goto</h2>"])
			data[1].push("blank")

			achData.forEach(e => {
				if (e.Unlocked()) {
					data[1].push(["display-text", `<a href='#ach-${e.Id}' style='color:white'>- ${e.Name}</a>`])
				}
			})

			data[1].push("blank")
			data[1].push(["display-text", "<h2 style='color:#03d3fc'>Achievements</h2>"])
			data[1].push("blank")

			achData.forEach(e => {
				if (e.Unlocked()) {
					data[1].push(["display-text", `<h3 id='ach-${e.Id}' style='color:${e.Color}'>${e.Name}</h3>`])
					data[1].push(["display-text", "<a href='#ach-achievements' style='color:white;font-size:12px'>(Goto top)</a>"])
					data[1].push("blank")
					data[1].push(["achievements", e.Rows])
					data[1].push(["blank", "50px"])
				}
			})
			return data
		},
	],
	achievements: function() {
		let achs = {}

		for (let i = 0; i < achInfo.length; i++) {
			const id = 11 + i % 7 + Math.floor(i / 7) * 10
			achs[id] = Achievement(i + 1, achInfo[i].Done, achInfo[i].Tool, achInfo[i].Style)
		}

		return achs

	}(),
})