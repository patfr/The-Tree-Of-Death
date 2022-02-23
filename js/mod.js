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
	num: "0.002",
	name: "Dead",
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
	${GlowText("h3", "23,500", "#106b00")} Uranium (Last updated v0.002)<br>
	<br>
	<h2 style='color:green'>Notes:</h2><br><br>
	<span style='color:yellow'>Versions will be v</span><span style='color:red'>A</span>.<span style='color:lime'>B</span>.<span style='color:blue'>C</span><br>
	- <span style='color:red'>A</span> will be big updates.<br>
	- <span style='color:lime'>B</span> will be small updates.<br>
	- <span style='color:blue'>C</span> will be bug fixes.<br>
	<br><br><br>
	${VersionText("v0.002", ["Added 1 row of Achievements", "Added 5 Uranium upgrades", "Fixed mispelling of thirteen", "Changed Uranium II description to make it more clear"])}
	${VersionText("v0.001", ["Added Uranium", "Added 2 rows of Achievements", "Added 5 Uranium upgrades"])}
`

let winText = `Congratulations! You have reached the end and beaten this game, but for now...`

var doNotCallTheseFunctionsEveryTick = ["blowUpEverything"]

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
	if (hasUpgrade("u", 11)) gain = gain.mul(upgradeEffect("u", 11))
	if (hasUpgrade("u", 14)) gain = gain.mul(upgradeEffect("u", 14))
	if (hasUpgrade("u", 25)) gain = gain.pow(upgradeEffect("u", 25))
	return gain
}

function addedPlayerData() { return {
}}

var displayThings = [
	() => `<br>Inspired by ${GlowText("span", "pg132", "white")}'s mod "The Tree of Life"`
]

function isEndgame() {
	return player.u.points.gte(2.35e4)
}

var backgroundStyle = {

}

function maxTickLength() {
	return(3600)
}

function fixOldSave(oldVersion){
}