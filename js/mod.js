const GlowText = (t, m, c) => `<${t} style='color:${c};text-shadow: 0 0 10px ${c}'>${m}</${t}>`

let modInfo = {
	name: "The Tree Of Death",
	id: "TheTreeOfDeath",
	author: "patfr",
	pointsName: "Death Points",
	modFiles: ["layers.js", "tree.js"],

	discordName: "My discord server",
	discordLink: "https://discord.gg/7ahtMyv5hX",
	initialStartPoints: new Decimal (0),
	offlineLimit: 0,
}

let VERSION = {
	num: "0.006",
	name: "Chemicals",
}

function VersionText(v, t) {
	let text = `<h3 style='color:red'>${v}</h3><br>`
	for (let a of t) {
		text += `- ${a}.<br>`
	}
	return `${text}<br>`
}

let changelog = `<h1>Changelog:</h1><br><br>
	<h2 style='color:yellow'>Endgame:</h2><br><br>
	${GlowText("h3", "3", "#666111")} Toxins & ${GlowText("h3", "15", "#6e6e6e")} Lethal Gain & ${GlowText("h3", "15", "#6e6e6e")} Healthy Gain (Last updated v0.006)<br>
	<br>
	<span style='color:yellow'>Version number format: v</span><span style='color:red'>A</span>.<span style='color:lime'>B</span>.<span style='color:blue'>C</span><br>
	- <span style='color:red'>A</span> is for big patches.<br>
	- <span style='color:lime'>B</span> is for small patches.<br>
	- <span style='color:blue'>C</span> is for bug fixes.<br>
	<br>
	<h2 style='color:green'>Current version:</h2><br><br>
	${VersionText("v0.006"  , ["Added two Toxins milestones", "Added Chemicals", "Added five buyables", "Added a Venom upgrades", "Added two Chemical upgrades", "Added four rows of achievements", "Fixed some bugs"])}
	<br><h2 style='color:green'>Older versions:</h2><br><br>
	${VersionText("v0.005"  , ["Added Venom upgrades", "Added two new Toxins milestones", "Added a Toxins effect", "Added a row of achievements", "Changed Toxins milestone 1", "Changed balancing for venom buyables"])}
	${VersionText("v0.004"  , ["Added Toxins", "Added Venom", "Added 2 rows of achievments", "Added some features in achievements tab", "Added a Toxins milestone", "Added three Toxins buyables", "Changed all info tabs"])}
	${VersionText("v0.003.1", ["Changed Rad upgrades into a buyable instead", "Fixed milestone incorrect description", "Added more formula information", "Changed Uranium upgrade IX", "Changed 4th row of achievements to only show when you unlock Rads", "Rebalanced the game after the changes to IX"])}
	${VersionText("v0.003"  , ["Added 1 row of Achievements", "Added 5 Uranium upgrades", "Added a new layer", "Added 25 Rad upgrades", "Added 4 Rad milestones", "Uranium gain now properly works", "Added an info tab for Uranium layer", "Added a past endgame warning", "Changed Uranium symbol U => Ur"])}
	${VersionText("v0.002"  , ["Added 1 row of Achievements", "Added 5 Uranium upgrades", "Fixed mispelling of thirteen", "Changed Uranium II description to make it more clear"])}
	${VersionText("v0.001"  , ["Added Uranium", "Added 2 rows of Achievements", "Added 5 Uranium upgrades"])}
`

let winText = `Congratulations! You have reached the end of The Tree Of Death. Thank you for playing more content will come.`

var doNotCallTheseFunctionsEveryTick = []

function getStartPoints(){
    return new Decimal(modInfo.initialStartPoints)
}

function canGenPoints(){
	return true
}

function getPointGen() {
	if(!canGenPoints())
		return new Decimal(0)

	let gain = new Decimal(0.1)
	gain = gain.add(getBuyableAmount("r", 11))
	if (hasUpgrade("u", 11)) gain = gain.mul(upgradeEffect("u", 11))
	if (hasUpgrade("u", 14)) gain = gain.mul(upgradeEffect("u", 14))
	if (hasUpgrade("t", 24)) gain = gain.mul(upgradeEffect("t", 24))
	if (hasUpgrade("u", 25)) gain = gain.pow(upgradeEffect("u", 25))
	if (hasUpgrade("u", 31)) gain = gain.mul(upgradeEffect("u", 31))
	return gain
}

function addedPlayerData() { return {
}}

var displayThings = [
	() => `<br>Inspired by ${GlowText("span", "pg132", "white")}'s mod "The Tree of Life"`,
	"<br>",
	() => player.keepGoing ? `<h3 style='color:maroon'>Your past endgame</h3><br><h3 style='color:maroon'>The game may not</h3><br><h3 style='color:maroon'>be balanced past this</h3>` : ""
]

function isEndgame() {
	return player.t.points.gte(3) && getBuyableAmount("t", 31).gte(15) && getBuyableAmount("t", 32).gte(15)
}

var backgroundStyle = {

}

function maxTickLength() {
	return(3600)
}

function fixOldSave(oldVersion) {
	switch (oldVersion) {
		case "0.003":
			player.r.buyables[11] = new Decimal(player.r.upgrades.length)
			break;
		case "0.003.1":
			player.r.points = player.r.points.min(1000)
		default:
			break;
	}
}