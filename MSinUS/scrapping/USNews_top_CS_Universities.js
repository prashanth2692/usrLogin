/**
 * Data scrapped from https://www.usnews.com/best-graduate-schools/top-science-schools/computer-science-rankings
 */

const siteURL = "https://www.usnews.com/best-graduate-schools/top-science-schools/computer-science-rankings"
// This command gets ts elements which hold data of universities
let trs = document.querySelectorAll("table.TableTabular__TableContainer-s1utwgcg-1 tr span div")

// this command parses trs and extracts innerText and returns list of universites iwth detials
let universitiesList = Array.from(trs).map(tr => Array.from(tr.children).map(trc => trc.innerText))

/**
 * universitiesList = university[]
 * university = ["Carnegie Mellon University", "Pittsburgh, PA", "#1 in Computer Science (tie)"] // sample
 *  */


