function validateSyntax( string ) {
    if (!string.trim()=="" || !string.trim().endsWith(":")) {
        return{type: "cmd", string: string};
    }
    let trimed = string.trim();
    if (trimed == "" || trimed.startsWith(";")) {
        return {type: "skip"};
    }
    if (trimed.endsWith(":")) {
        let Label = string.slice(0,-1);
        return {type: "label", string: Label};
    }

}
module.exports = {validateSyntax};