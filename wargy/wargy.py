from flask import Flask, jsonify, render_template
from os import path
from collections import OrderedDict

dir_path = path.dirname(path.realpath(__file__))
template_folder = path.join(path.dirname(dir_path), "public")
static_folder = path.join(template_folder, "dist")
app = Flask(__name__, template_folder=template_folder,
            static_folder=static_folder,
            static_url_path="/static")

@app.route("/")
def index():
    return render_template("index.html")

class Wargy(object):
    def __init__(self,
                 parser,
                 all_caps_words,
                 excluded_arg_groups):
        self.app = app
        self.parser = parser
        self.all_caps_words = all_caps_words
        self.excluded_arg_groups = excluded_arg_groups

        def args_view():
            return self.arg_parser_to_json(parser=self.parser)
        self.app.add_url_rule(
            "/wargy/api/v0.0.1/args",
            methods=["GET"],
            view_func=args_view)

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
