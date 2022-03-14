/**
* Documentation generator
* Author: Adam Brewer
*/

const DOC_SPACING = 23;
const DOC_SECTION_BORDER_LENGTH = 72;

const _DNE = -69;
const _INVALID_ARGUMENT_COUNT = -68;

import util = require('util');

/*
************************************************************************
* START 'DOCSTRING TEMPLATES'
************************************************************************
*/
// String replacements:
// <METHOD> <NAME> <QUERY PARAMETERS> <RETURN>
const _API_ROUTE_DOCSTRING = `/** API ROUTE DEFINITION
* METHOD:              %s
* NAME:                '%s'
* QUERY PARAMETERS:
*                       %s
* RETURN:               %s
*/`;

// String replacements:
// <NAME> <DESCRIPTION> <SCOPE> <ARGUMENTS> <RETURN>
const _FUNCTION_DOCSTRING = `/** %s
* %s
* SCOPE:                %s
* ARGUMENTS:
*                       %s
* RETURN:               %s
*/`;

// String replacements:
// <SECTION NAME>
const _START_SECTION_DOCSTRING = `/*
${'*'.repeat(DOC_SECTION_BORDER_LENGTH)}
* START '%s'
${'*'.repeat(DOC_SECTION_BORDER_LENGTH)}
*/`;

// String replacements:
// <SECTION NAME>
const _END_SECTION_DOCSTRING = `/*
${'*'.repeat(DOC_SECTION_BORDER_LENGTH)}
* END '%s'
${'*'.repeat(DOC_SECTION_BORDER_LENGTH)}
*/`;
/*
************************************************************************
* END 'DOCSTRING TEMPLATES'
************************************************************************
*/

/*
************************************************************************
* START 'HELPER MAPS'
************************************************************************
*/
const _ERR_MAP: Record<string, string> = {};
_ERR_MAP[_DNE] = 'DOES NOT EXIST'; 
_ERR_MAP[_INVALID_ARGUMENT_COUNT] = 'NOT ENOUGH ARGUMENTS'; 

const _PARSE_MAP: Record<string, (...args: any[]) => string | void>  = {
    'h': _get_help,
    'help': _get_help,
    'api': generate_api_route_doc,
    'function': generate_function_doc,
    'func': generate_function_doc,
    'sect': generate_section_doc,
    'section': generate_section_doc,
    'clear': _clear,
    'cls' : _clear,
    'quit': _quit_cli,
    'q': _quit_cli
};
/*
************************************************************************
* END 'HELPER MAPS'
************************************************************************
*/

function _parse_input_string(input_string: string) : string[] {
    let parsed: string[] = [];
    let parsed_long_str = '';
    let i = 0;
    while(i < input_string.length){
        if(input_string[i] == '"'){
            while(input_string[++i] != '"'){
                parsed_long_str += input_string[i];
            }
            parsed.push(parsed_long_str);
            parsed_long_str = '';
            i++;
        } else {
            while(i < input_string.length && input_string[i] != ' '){
                parsed_long_str += input_string[i++];
            }
            parsed.push(parsed_long_str);
            parsed_long_str = '';
        }
        i++;
    }
    return parsed;
}

function _execute_from_parse_map(key: string, args?: string[]) : string {
    if(!Object.keys(_PARSE_MAP).includes(key)) throw _DNE;
    const func = _PARSE_MAP[key];
    return func.apply(this, args);
}

function _get_help() : string {
    return (
        `Help Menu:    
        Commands:
            <command accessors> | <arguments>                
            api | <METHOD> <NAME> <QUERY PARAMETERS> <RETURN>
                Generates documentation for the described API route
                RETURN: the generated documentation, as a string
            function, func | <NAME> <DESCRIPTION> <SCOPE> <ARGUMENTS> <RETURN>
                Generates documentation for the described function
                RETURN: the generated documentation, as a string
            section, sect | <NAME>
                Generates start and end documentation for the given
                section
                RETURN: the generated documentation, as a string
            help, h:
                Displays this help message
                RETURN: this help message, as a string
            clear, cls:
                Clears console
                RETURN: void
            quit, q:
                Exit console`
    );
}

function _clear() : void { console.clear(); }
function _quit_cli(): void { process.exit(1); }

function generate_section_doc(name: string) : string {
    return util.format(_START_SECTION_DOCSTRING, name) + '\n' +
    util.format(_END_SECTION_DOCSTRING, name);
}

function generate_api_route_doc(method: string, name: string, param_string?: string, returns?: string) : string {
    let formatted_param_string = '';
    if (typeof param_string !== 'undefined' && param_string.length > 0){
            let param_string_arr = param_string.split(',');
            formatted_param_string = param_string_arr[0];
            if(param_string_arr.length > 1){
                for(let i = 1; i < param_string_arr.length; i++){
                    formatted_param_string += `\n*${' '.repeat(DOC_SPACING)}${param_string_arr[i]}`;
                }
            }
    } else throw _INVALID_ARGUMENT_COUNT;
    const return_str = typeof returns !== 'undefined' ? returns : 'None';
    return util.format(
        _API_ROUTE_DOCSTRING, 
        method, 
        name, 
        formatted_param_string, 
        return_str
    );
}

function generate_function_doc(name: string, scope: string, description: string,  arg_string?: string, returns?: string) : string {
    let formatted_arg_string = '';
    if (typeof arg_string !== 'undefined' && arg_string.length > 0){
            let arg_string_arr = arg_string.split(',');
            formatted_arg_string = arg_string_arr[0];
            if(arg_string_arr.length > 1){
                for(let i = 1; i < arg_string_arr.length; i++){
                    formatted_arg_string += `\n*${' '.repeat(DOC_SPACING)}${arg_string_arr[i]}`;
                }
            }
    } else throw _INVALID_ARGUMENT_COUNT;
    const return_str = typeof returns !== 'undefined' ? returns : 'None';
    return util.format(
        _FUNCTION_DOCSTRING,
        name,
        description,
        scope,
        formatted_arg_string,
        return_str
    );
}

// Interactable CLI
function main() : void {
    /**
    * Sets up and runs the interactable CLI
    */
    // Setup prompt, with history and autocomplete enabled
    const _prompt = require('prompt-sync')({
        history: require('prompt-sync-history')(),
        autocomplete: (str) => {
            let commands = Object.keys(_PARSE_MAP);
            let ret: string[] = [];
            for (let i = 0; i < commands.length; i++) {
                if (commands[i].indexOf(str) == 0)
                ret.push(commands[i]);
            }
            return ret;
        },
        sigint: false
    });

    // Start REPL
    for(;;) {
        const user_input = _prompt('$');
        if(user_input){
            try {
                let parsed = _parse_input_string(user_input);
                const result = _execute_from_parse_map(parsed[0], parsed.slice(1));
                console.log(typeof result !== 'undefined' ? result : 'Command successful');
            } catch (error) {
                if(Object.keys(_ERR_MAP).includes(error.toString())) console.error(`[ERROR](${error}) ${_ERR_MAP[error]}`);
                else console.error(`[ERROR] Errored with unknown code: ${error}`);
            }
        }
    }
}

module.exports = {
    generate_api_route_doc: generate_api_route_doc,
    generate_function_doc: generate_function_doc,
    generate_section_doc: generate_section_doc
};

if (require.main === module) main();