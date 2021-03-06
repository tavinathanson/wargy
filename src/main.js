import _ from 'lodash';
import React from 'react';
import { render } from 'react-dom';
import { Button, Input, Container, Checkbox, Header, Menu, Dropdown, Image,
         Table, Grid, Segment, Dimmer, Popup, Label, Form, Loader } from 'semantic-ui-react';
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
        if (!_.isEmpty(this.props.arg.default)) {
            this.props.setArgState(this.props.arg.arg, this.props.arg.default);
        }
    }

    render() {
        var innerComponent = null;
        if (typeof(this.props.arg.default) === 'boolean' || this.props.arg.type === 'bool') {
            // Convert default value to true/false
            var defaultChecked = false;
            var defaultValue = this.props.getArgState(this.props.arg.arg);
            if (_.isBoolean(defaultValue)) {
                defaultChecked = defaultValue;
            }

            innerComponent = <Checkbox toggle
                                       checked={defaultChecked}
                                       label={this.props.arg.human_arg}
                                       onChange={(e, { checked }) => this.props.handleChange(this.props.arg.arg, e, checked)} />;
        }
        else if (typeof(this.props.arg.default) === 'number' ||
                 this.props.arg.type === 'float' ||
                 this.props.arg.type == 'int') {
            innerComponent = (
                <Form.Field>
                    <label> {this.props.arg.human_arg}</label>
                    <Input size='small'
                           value={this.props.getArgState(this.props.arg.arg)}
                           onChange={(e) => this.props.handleChange(this.props.arg.arg, e)} />
                </Form.Field>
            );
        }
        else if (this.props.arg.type === 'file' ||
                 argContainsWords(this.props.arg.arg, FILE_WORDS)) {
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
                <Form.Field>
                    <label> {this.props.arg.human_arg}</label>
                    <Upload {...props}>
                        <AntButton>
                            <Icon type='upload' />Upload File
                        </AntButton>
                    </Upload>
                </Form.Field>
            );
        }
        else {
            innerComponent = (
                <Form.Field>
                    <label> {this.props.arg.human_arg}</label>
                    <Input size='small'
                           value={this.props.getArgState(this.props.arg.arg)}
                           onChange={(e) => this.props.handleChange(this.props.arg.arg, e)} />
                </Form.Field>
            );
        }

        var component = innerComponent;
        if (!_.isEmpty(this.props.arg.help)) {
            component = <Popup
                            inverted
                            size='mini'
                            trigger={innerComponent}
                            content={this.props.arg.help} />;
        }
        return component;
    }
}

export class OutputComponent extends React.Component {
    constructor(props) {
        super(props);

        // Input format:
        // [{colname: [item, item, item]}, {colname: [item, ...]}, ...]
    }

    render() {
        var headerCells = [];
        var rowToCells = {};
        this.props.contents.map(function(col, col_i) {
            var firstEntry = Object.entries(col)[0];
            var colName = firstEntry[0];
            var colValues = firstEntry[1];

            headerCells.push(<Table.HeaderCell key={col_i}>{colName}</Table.HeaderCell>);

            colValues.map(function(colValue, row_i) {
                if (_.isUndefined(rowToCells[row_i])) {
                    rowToCells[row_i] = [];
                }
                rowToCells[row_i].push(<Table.Cell key={col_i}>{colValue}</Table.Cell>);
            });
        });

        var tableElements = [];
        tableElements.push(
            <Table.Header key='tableheader'>
                <Table.Row>
                    {headerCells}
                </Table.Row>
            </Table.Header>
        );

        var rowElements = [];
        // TODO: make map vs. each usage consistent
        // Iterate in numerical row order over the table
        _.each(_.range(_.size(rowToCells)), function(rowNum) {
            var tableCells = rowToCells[rowNum];
            rowElements.push(
                <Table.Row key={rowNum}>
                    {tableCells}
                </Table.Row>
            );
        });

        tableElements.push(
            <Table.Body key='tablebody'>
                {rowElements}
            </Table.Body>
        );

        return (
            <div style={{'overflowX': 'scroll'}}>
                <Table compact size='small'>
                    {tableElements}
                </Table>
            </div>
        );
    }
}

export class InputComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            isTableLoaded: false,
            expanded: true
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.setArgState = this.setArgState.bind(this);
        this.getArgState = this.getArgState.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();

        // TODO: don't hardcode this; too fragile
        var body = JSON.stringify(_.omit(this.state, ['error', 'isLoaded', 'isTableLoaded', 'tableContents', 'expanded', 'args']));
        fetch('/wargy/api/v0.0.1/submit', {
            method: 'post',
            headers: {'Content-Type':'application/json'},
            body: body})
            .then(res => res.json())
            .then(
                (result) => { this.setState({isTableLoaded: true, tableContents: result.table_contents}); },
                (error) => { this.setState({isTableLoaded: true, error}); }
            )
            .then(() => console.log(this.state));
        console.log(this.state);
    };

    setArgState(arg, value) {
        var obj = {};
        obj[arg] = value;
        this.setState(obj);
    }

    handleChange(arg, event, checked) {
        var value = null;
        if (_.isUndefined(checked)) {
            value = event.target.value;
        }
        else {
            value = checked;
        }
        this.setArgState(arg, value);
    }

    getArgState(arg) {
        return this.state[arg];
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
            return <Container><p>Error: {error.message}</p></Container>;
        } else if (!isLoaded) {
            return <Loader active inline='centered'>Loading...</Loader>;
        } else {
            var elements = [];
            // TODO: change to camelCase
            var group_names = [];
            var group_elements = {};
            var self = this; // Make accessible in the closure below
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
                        <Grid.Column key={arg_i}>
                            <ArgumentComponent arg={arg}
                                               handleChange={self.handleChange}
                                               setArgState={self.setArgState}
                                               getArgState={self.getArgState} />
                        </Grid.Column>
                    );
                });
            });

            group_names.map(function(group_name, i) {
                elements.push(
                    <Segment.Group key={i}>
                        <Segment color='violet'><h2>{group_name}</h2></Segment>
                        <Segment>
                            <Form>
                                <Grid columns={2}>
                                    {group_elements[group_name]}
                                </Grid>
                            </Form>
                        </Segment>
                    </Segment.Group>
                );
            });
            elements.push(
                <Segment key='formfooter'>
                    <Form>
                        <Button onClick={self.handleSubmit}>Submit</Button>
                        <Button>Clear</Button>
                    </Form>
                </Segment>
            );

            if (this.state.isTableLoaded) {
                elements.push(<OutputComponent contents={this.state.tableContents} />);
            }

            return <Container text>{elements}</Container>;
        }
    }
}
