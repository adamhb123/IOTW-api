export module Succ{
    type ParseFunction = (...args: any[]) => string | void;
    export class CLICommand {
        readonly identifier: string;
        readonly associate_function: ParseFunction
        readonly is_primary: Boolean = false;
        constructor(identifier: string, associate_function: ParseFunction, is_primary?: Boolean){
            this.identifier = identifier;
            this.associate_function = associate_function;
            this.is_primary = is_primary;
        }
    }
}
