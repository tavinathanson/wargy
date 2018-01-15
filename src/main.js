import _ from 'lodash';
import React from 'react';
import { render } from 'react-dom';
import { Button, Input, Container, Checkbox, Header, Menu, Dropdown, Image,
         Table, Grid, Segment, Dimmer, Popup, Label } from 'semantic-ui-react';
import { Upload, Icon, Button as AntButton, message } from 'antd';
const Dragger = Upload.Dragger;

const FILE_WORDS = ['file', 'path'];

function argContainsWords(arg, words) {
    var parts = _.split(_.lowerCase(arg), /[ \-_]+/);

    // If any part of the argument contains a word, return true
    var returnVal = false;
    _.each(words, function(word) {
        if (_.includes(parts, word)) {
            returnVal = true;
        }
    });

    return returnVal;
}

class ArgumentComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const iStyle = {
            maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden'
        };
        var innerComponent = null;
        if (typeof(this.props.arg.default) === 'boolean' || this.props.arg.type === 'bool') {
            innerComponent = <Checkbox toggle label={this.props.arg.human_arg} />;
        }
        else if (typeof(this.props.arg.default) === 'number' ||
                 this.props.arg.type === 'float' ||
                 this.props.arg.type == 'int') {
            innerComponent = <Input label={this.props.arg.human_arg} style={iStyle} labelPosition='right' />;
        }
        else if (argContainsWords(this.props.arg.arg, FILE_WORDS)) {
            const props = {
                name: 'file',
                action: '//jsonplaceholder.typicode.com/posts/',
                headers: {
                    authorization: 'authorization-text',
                },
                onChange(info) {
                    if (info.file.status === 'done') {
                        message.success(`${info.file.name} uploaded successfully.`);
                    } else if (info.file.status === 'error') {
                        message.error(`${info.file.name} upload failed.`);
                    }
                },
            };

            innerComponent = (
                <Upload {...props}>
                    <AntButton>
                        <Icon type="upload" />Upload {this.props.arg.human_arg}
                    </AntButton>
                </Upload>
            );
        }
        else {
            innerComponent = <p style={iStyle}>{this.props.arg.human_arg}</p>;
        }

        var component = <Popup trigger={innerComponent} content={this.props.arg.human_arg + ': ' + this.props.arg.help} />;
        return (
            <Segment>
                {component}
            </Segment>
        );
    }
}

export class InputComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            expanded: true
        };
    }

    componentDidMount() {
        fetch('/wargy/api/v0.0.1/args')
            .then(res => res.json())
            .then(
                (result) => { this.setState({isLoaded: true, args: result.args}); },
                (error) => { this.setState({isLoaded: true, error}); }
            );
    }

    render() {
        const { error, isLoaded, args } = this.state;
        if (error) {
            return <p>Error: {error.message}</p>;
        } else if (!isLoaded) {
            return <p>Loading...</p>;
        } else {
            var elements = [];
            var group_names = [];
            var group_elements = {};
            args.map(function(arg_group, i) {
                // Arg group names
                var first_entry = Object.entries(arg_group)[0];
                var group_name = first_entry[0];
                group_names.push(group_name);

                // Arg group contents.
                var group_values = first_entry[1];
                group_elements[group_name] = [];
                group_values.map(function(arg, arg_i) {
                    group_elements[group_name].push(
                        <ArgumentComponent key={arg_i} arg={arg} />
                    );
                });
            });

            group_names.map(function(group_name, i) {
                elements.push(
                    <Grid.Column key={i}>
                        <Segment.Group>
                            <Segment color='violet'><h2>{group_name}</h2></Segment>
                            {group_elements[group_name]}
                        </Segment.Group>
                    </Grid.Column>
                );
            });

            return <Grid columns={2} stackable>{elements}</Grid>;
        }
    }
}
