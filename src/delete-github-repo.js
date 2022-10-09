#!/usr/bin/env node
const inquirer = require('inquirer');
const chalk = require('chalk');
const pkg = require('../package.json');
const spinner = require('./utils/spinner');
const API = require('./utils/api');
// https://github.com/settings/tokens/new

let api = null;
let spinnerInstance = null;

const { Command } = require('commander');
const program = new Command();

program
  .description(pkg.description)
  .version(pkg.version);

program.parse();

inquirer
    .prompt([
        {
            message: '请输入你的token(可以在这里创建https://github.com/settings/tokens/new)',
            name: 'token',
            type: 'input',
            validate(token) {
                const done = this.async();
                if (token.trim().length === 0) {
                    done('请至少选择一个仓库');
                    return;
                }
                done(null, true);
            },
        }
    ])
    .then(async (answers) => {
        const token = answers.token;
        api = new API(token);

        spinnerInstance = spinner('正在获取仓库所有者信息');
        const owner = await api.getOwer();
        spinnerInstance.succeed('获取仓库所有者信息成功');
    
        spinnerInstance = spinner('正在获取仓库列表');
        const repos = await api.getRepos();
        if (repos.length === 0) {
            spinnerInstance.warn('仓库数量为0，可能有以下原因:\n1.你当前的仓库都没private仓库并且传入的token可能没有勾选[repo]权限。2.你暂时没有创建仓库。\n可在：https://github.com/settings/tokens/new，重新生成token，请至少勾选 delete_repo 和 repo 两项权限。');
            return;
        }
        spinnerInstance.succeed('获取仓库列表成功');

        inquirer
            .prompt([
                {
                    message: '请选择需要删除的仓库',
                    name: 'repos',
                    type: 'checkbox',
                    validate(repos) {
                        const done = this.async();
                        if (repos.length === 0) {
                            done('请至少选择一个仓库');
                            return;
                        }
                        done(null, true);
                    },
                    choices: repos
                }
            ])
            .then(async (answers) => {
                const reposCount = answers.repos.length;
                for (let i = 0; i < reposCount; i++) {
                    spinnerInstance = spinner(`正在删除仓库${answers.repos[i]}`);
                    await api.deleteRepoByName(answers.repos[i], owner);
                    spinnerInstance.succeed(`仓库${answers.repos[i]}删除成功`);
                }
                spinnerInstance.succeed(`任务执行完成，共删除${chalk.green(reposCount)}个仓库`);
            })
            .catch((error) => {
                if (error.status === 403) {
                    // delete_repo  repo
                    spinnerInstance.fail('传入的token已过期或没勾选[delete_repo]权限，请重新生成。\n生成地址为：https://github.com/settings/tokens/new');
                    return;
                }
                throw error;
            });
    })
    .catch((error) => {
        if (error.status === 401) {
            spinnerInstance.fail('传入的token已过期或没权限，请重新生成。\n生成地址为：https://github.com/settings/tokens/new\n请至少勾选 [delete_repo] 和 [repo] 两项权限。');
            return;
        }
        throw error;
    });