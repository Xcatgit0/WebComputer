function validateSyntax( string ) {
    if (!string.trim().endsWith(":")&& !string.trim().startsWith(";")) {
        return{type: "cmd", string: string};
    }
    let trimed = string.trim();
    if (trimed == "" || trimed.startsWith(";")) {
        return {type: "skip"};
    }
    if (trimed.endsWith(":")) {
        let Label = string.slice(0,-1).trim();
        return {type: "label", string: Label};
    }

}
module.exports = {validateSyntax};
