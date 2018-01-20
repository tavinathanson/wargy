from flask import jsonify, request
from os import path
from collections import OrderedDict

class Wargy(object):
    def __init__(self,
                 app,
                 parser,
                 submission_handler,
                 arg_types_override,
                 all_caps_words,
                 excluded_arg_groups):
        self.app = app
        self.parser = parser
        self.submission_handler = submission_handler
        self.arg_types_override = arg_types_override
        self.all_caps_words = all_caps_words
        self.excluded_arg_groups = excluded_arg_groups
        self.submitted = {}

        def args_endpoint():
            return self.arg_parser_to_json(parser=self.parser)
        self.app.add_url_rule(
            "/wargy/api/v0.0.1/args",
            methods=["GET"],
            view_func=args_endpoint)

        def submit_endpoint():
            # TODO: do something instead of assuming a DataFrame
            df = self.process_submission(request.json)
            return jsonify({"table_contents": df.to_dict("list")})
        self.app.add_url_rule(
            "/wargy/api/v0.0.1/submit",
            methods=["POST"],
            view_func=submit_endpoint)

    def arg_parser_to_json(self, parser):
        # Iterate through all arg groups, and create an OrderedDict of them.
        d_keys = []
        d_values = []
        for group in parser._action_groups:
            if group.title not in self.excluded_arg_groups:
                d_keys.append(group.title)
                d_values.append([])
        d = OrderedDict(zip(d_keys, d_values))

        # Iterate through all args, and use the above OrderedDict to file
        # them in place.
        for action in parser._actions:
            group_title = action.container.title
            if group_title in self.excluded_arg_groups:
                continue

            arg_obj = {}
            arg_obj["arg"] = action.dest
            arg_obj["human_arg"] = self.to_human_arg_name(action.dest)
            arg_obj["help"] = action.help
            arg_obj["default"] = action.default

            arg_obj["type"] = str(action.type.__name__) if action.type is not None else None
            if action.dest in self.arg_types_override:
                arg_obj["type"] = self.arg_types_override[action.dest]

            d[group_title].append(arg_obj)

        # Convert OrderedDict into a list of dicts, which can be jsonified in order.
        l = []
        for key, value in d.items():
            l.append({key: value})
        return jsonify({"args": l})

    def to_human_arg_name(self, arg_name):
        words = []
        for word in arg_name.split("_"):
            if word.upper() in self.all_caps_words:
                words.append(word.upper())
            else:
                words.append(word.title())
        return " ".join(words)

    def process_submission(self, d):
        # TODO: can't assume that all args are prefixed with --, etc.
        # TODO: -/_ replacement doesn't work if we started off with underscores
        args_list = ["--{} {}".format(key.replace("_", "-"), value) for (key, value) in d.items()]
        # Separate all args from their values in the list
        args_list = " ".join(args_list).split(" ")
        # Debugging
        print(args_list)
        args = self.parser.parse_args(args_list)
        return self.submission_handler(args)
