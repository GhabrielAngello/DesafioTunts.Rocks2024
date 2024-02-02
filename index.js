const axios = require("axios");

function calcularSituacao(media, faltas, totalAulas) {
  const limiteFaltas = totalAulas * 0.25;

  if (faltas > limiteFaltas) {
    return 'Reprovado por Faltas';
  }

  if (media < 5) {
    return 'Reprovado por Nota';
  } else if (media >= 5 && media < 7) {
    const naf = calcularNAF(media);
    if (naf >= 5) {
      return 'Aprovado';
    } else {
      return 'Exame Final';
    }
  } else {
    return 'Aprovado';
  }
}

function formatarNota(nota) {
  const notaFormatada = parseFloat(nota.replace(',', '.'));
  return parseFloat((notaFormatada * 0.1).toFixed(2));
}

function formatarMedia(media) {
  return parseFloat(media);
}

function calcularNAF(media) {
  return parseFloat((Math.max(0, 7 - media)).toFixed(2));
}

function coletar() {
  const totalAulas = 60;

  return axios.get('https://sheetdb.io/api/v1/zcv8nk9ijkro4', {
    auth: {
      username: "h4zs9sgw",
      password: "9kt18jx03t5pu1xirt0c"
    }
  })
  .then(response => {
    const alunos = response.data;
    const alunosAtualizados = alunos.map(aluno => {
      aluno.Matricula = parseInt(aluno.Matricula); 
      aluno.ID = aluno.Matricula;

      if (!aluno.ID) {
        console.error('Erro: Aluno sem ID válido - Matrícula:', aluno.Matricula);
        return null;
      }

      aluno.P1 = formatarNota(aluno.P1);
      aluno.P2 = formatarNota(aluno.P2);
      aluno.P3 = formatarNota(aluno.P3);

      aluno.Faltas = parseInt(aluno.Faltas);

      const faltas = aluno.Faltas;

      const media = ((parseFloat(aluno.P1) + parseFloat(aluno.P2) + parseFloat(aluno.P3)) / 3).toFixed(2);

      aluno.Media = formatarMedia(media);

      aluno.NAF = calcularNAF(parseFloat(media));

      axios.put(`https://sheetdb.io/api/v1/zcv8nk9ijkro4/Matricula/${aluno.Matricula}`, {
        'Nota para Aprovacao Final': aluno.NAF
      }, {
        auth: {
          username: "h4zs9sgw",
          password: "9kt18jx03t5pu1xirt0c"
        }
      })
      .then(response => console.log(`Nota para Aprovacao Final do aluno ${aluno.Matricula} atualizada com sucesso.`))
      .catch(error => console.error(`Erro ao atualizar Nota para Aprovacao Final do aluno ${aluno.Matricula}:`, error));

      aluno.Situacao = calcularSituacao(parseFloat(media), faltas, totalAulas);
      return aluno;
    });

    const alunosValidos = alunosAtualizados.filter(aluno => aluno !== null);

    alunosValidos.forEach(aluno => {
      axios.put(`https://sheetdb.io/api/v1/zcv8nk9ijkro4/Matricula/${aluno.Matricula}`, { Situacao: aluno.Situacao }, {
        auth: {
          username: "h4zs9sgw",
          password: "9kt18jx03t5pu1xirt0c"
        }
      })
      .then(response => console.log(`Situacao do aluno ${aluno.Matricula} atualizada com sucesso.`))
      .catch(error => console.error(`Erro ao atualizar Situacao do aluno ${aluno.Matricula}:`, error));
    });

    return alunosValidos;
  })
  .catch(error => console.error('Erro:', error));
}

coletar()
  .then(data => console.log('Dados coletados com situações calculadas:', data));