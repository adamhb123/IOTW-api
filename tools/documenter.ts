/**
 * Documentation generator
 */

const _DNE: number = -69;
const _NOT_ENOUGH_ARGUMENTS: number = -68;

const util = require('util');
const _prompt = require('prompt-sync')({sigint: true});

const _API_ROUTE_DOCSTRING: string = `/** API ROUTE DEFINITION
 * METHOD:              %s
 * NAME:                '%s'
 * QUERY PARAMETERS:    %s
 * RETURN: %s
 */`
const _FUNCTION_DOCSTRING: string = `/** %s
* DESCRIPTION: %s
* ARGUMENTS: %s
* RETURN: %s
*/`

const _ERR_MAP: Object = {
    _DNE: "DOES NOT EXIST",
    _NOT_ENOUGH_ARGUMENTS: "NOT ENOUGH ARGUMENTS"
}

const _PARSE_MAP: Object  = {
    '': _print_help,
    'h': _print_help,
    'help': _print_help,
    'api': generate_api_route_doc,
    'apidoc': generate_api_route_doc,
    'func': generate_function_doc
};

function _execute_from_parse_map(key: string, args?: string[]){
    if(!Object.keys(_PARSE_MAP).includes(key)) throw _DNE;
    let func: Function = _PARSE_MAP[key];
    return func.apply(this, args);
}

function _print_help(){
    console.log(
    `Help Menu:    
        Commands:
            <command accessors> | <arguments>
            help, h | None:
                Displays this help message
                RETURN: this help message, as a string
            apidoc, api | :
                Generates documentation for the described API route
                RETURN: the generated documentation, as a string
            
    `);
}

function generate_api_route_doc(method: string, name: string, param_string?: string[], returns?: string) {
    let formatted_query_parameter_string: string = '';
    if (typeof param_string !== 'undefined'){
        if(param_string.length == 1){
            formatted_param_string += `*\t${param_string}`;
        } else{
            param_string.forEach(_param => {
                formatted_param_string += `*\t${param_string}`;
            });
        }
    }
    return util.format(_API_ROUTE_DOCSTRING, 
        method, 
        name, 
        formatted_query_parameter_string, 
        typeof returns !== 'undefined' ? returns : 'None');
}

function generate_function_doc(name: string, arguments?: string[], returns?: string){

}

module.exports = {
    generate_api_route_doc: generate_api_route_doc,
    generate_function_doc: generate_function_doc
}

// Interactable CLI
function main(){
    /**
    * Sets up and runs the interactable CLI
    */
    while(true){
        let user_input: string[] = _prompt('$').split(' ');
        try {
            _execute_from_parse_map(user_input[0], user_input.slice(1));
        } catch (error){
            if(Object.keys(_ERR_MAP).includes(error)) console.error(`[ERROR] ${_ERR_MAP[error]}`);
            else console.error(`[ERROR] Errored with unknown code: ${error}`);
        }
    }
}

main();
