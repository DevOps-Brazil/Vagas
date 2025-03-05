const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

async function main() {
  try {
    console.log(`Buscando issues para o repositório ${owner}/${repo}...`);

    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      per_page: 100,
      sort: 'created',
      direction: 'desc',
    });

    const vagasIssues = issues.filter(issue => !issue.pull_request);

    console.log(`Encontradas ${vagasIssues.length} vagas (issues abertas)...`);

    const readmePath = path.join(process.cwd(), 'README.md');
    let readmeContent = '';

    try {
      readmeContent = fs.readFileSync(readmePath, 'utf8');
    } catch (error) {
      console.log('README não encontrado. Criando um novo arquivo...');
      readmeContent = '# Vagas DevOps\n\nRepositório para divulgação de vagas de DevOps.\n';
    }

    let vagasSection = '## Vagas Disponíveis\n\n';

    if (vagasIssues.length === 0) {
      vagasSection += 'No momento não há vagas disponíveis. Fique atento para novas oportunidades!\n';
    } else {
      vagasSection += 'Lista de vagas disponíveis:\n\n';

      vagasIssues.forEach(issue => {
        const issueDate = new Date(issue.created_at).toLocaleDateString('pt-BR');
        vagasSection += `- [${issue.title}](${issue.html_url}) - _Publicada em ${issueDate}_\n`;
      });

      vagasSection += '\n## Como publicar uma vaga\n\n';
      vagasSection += 'Abra uma [nova issue](https://github.com/' + owner + '/' + repo + '/issues/new) com o título da vaga e todas as informações necessárias no corpo da issue.\n';
    }

    const startMarker = '<!-- VAGAS_START -->';
    const endMarker = '<!-- VAGAS_END -->';

    if (readmeContent.includes(startMarker) && readmeContent.includes(endMarker)) {
      const startIndex = readmeContent.indexOf(startMarker) + startMarker.length;
      const endIndex = readmeContent.indexOf(endMarker);

      readmeContent =
        readmeContent.substring(0, startIndex) +
        '\n' + vagasSection + '\n' +
        readmeContent.substring(endIndex);
    } else {
      readmeContent += `\n${startMarker}\n${vagasSection}\n${endMarker}\n`;
    }

    fs.writeFileSync(readmePath, readmeContent);
    console.log('README atualizado com sucesso!');

  } catch (error) {
    console.error('Erro ao atualizar o README:', error);
    process.exit(1);
  }
}

main();
