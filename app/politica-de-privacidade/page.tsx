import type { Metadata } from "next";

// Política de Privacidade (LGPD) — exigida pela Meta/Google pros anúncios e
// linkada no rodapé das LPs. Texto jurídico: mudou o conteúdo, atualiza a data.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Política de Privacidade — Jay Academy",
  description:
    "Como a Jay Academy coleta, usa e protege os seus dados pessoais, conforme a LGPD.",
  alternates: { canonical: "https://jayacademy.com.br/politica-de-privacidade" },
};

const EMPRESA = "JAMES OLAYA DESIGNER FACIAL LTDA - ME";
const CNPJ = "14.300.778/0001-20";
const SEDE = "Campinas/SP";
const EMAIL = "contato@jamesolaya.com.br";
const WHATSAPP = "+55 (19) 97163-4567";
const WHATSAPP_LINK = "https://wa.me/5519971634567";
const ATUALIZADA = "24 de setembro de 2026";

const css = `
.pp{--bg:#faf8f5;--tx:#1c1917;--mu:#57534e;--ln:#e7e2da;--ac:#b8892f;
  min-height:100vh;background:var(--bg);color:var(--tx);
  font-family:var(--font-inter),ui-sans-serif,system-ui,-apple-system,sans-serif;
  line-height:1.7;font-size:16px}
.pp *{box-sizing:border-box}
.pp header{border-bottom:1px solid var(--ln);background:#fff}
.pp .bar{max-width:760px;margin:0 auto;padding:18px 20px;font-size:12px;
  letter-spacing:4px;font-weight:700;color:var(--ac)}
.pp main{max-width:760px;margin:0 auto;padding:48px 20px 72px}
.pp h1{font-size:clamp(30px,6vw,42px);line-height:1.15;margin:0 0 8px;font-weight:800;letter-spacing:-.02em}
.pp .data{color:var(--mu);font-size:14px;margin:0 0 32px}
.pp h2{font-size:21px;line-height:1.3;margin:48px 0 12px;padding-top:28px;border-top:1px solid var(--ln);font-weight:700}
.pp h3{font-size:16px;margin:20px 0 6px;font-weight:700}
.pp p{margin:0 0 14px}
.pp ul{margin:0 0 14px;padding-left:22px}
.pp li{margin:0 0 6px}
.pp a{color:#8a6420;text-underline-offset:3px}
.pp strong{font-weight:700}
.pp .card{background:#fff;border:1px solid var(--ln);border-radius:12px;padding:18px 20px;margin:0 0 14px}
.pp .card p:last-child{margin:0}
.pp .tab{width:100%;overflow-x:auto;margin:0 0 14px}
.pp table{width:100%;border-collapse:collapse;font-size:15px;min-width:520px}
.pp th,.pp td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid var(--ln)}
.pp th{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--mu);font-weight:600}
.pp footer{border-top:1px solid var(--ln);color:var(--mu);font-size:13px;text-align:center;padding:24px 20px}
`;

export default function PoliticaDePrivacidade() {
  return (
    <div className="pp">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <header>
        <div className="bar">JAY ACADEMY</div>
      </header>

      <main>
        <h1>Política de Privacidade</h1>
        <p className="data">Última atualização: {ATUALIZADA}</p>

        <p>
          A Jay Academy respeita a sua privacidade. Esta política explica quais
          dados pessoais coletamos quando você visita o site{" "}
          <strong>jayacademy.com.br</strong>, fala com a gente ou compra um dos
          nossos cursos, para que usamos esses dados e quais são os seus
          direitos, conforme a Lei Geral de Proteção de Dados (Lei nº
          13.709/2018, a “LGPD”).
        </p>

        <h2>1. Quem somos</h2>
        <p>O responsável pelo tratamento dos seus dados (controlador) é:</p>
        <div className="card">
          <p>
            <strong>{EMPRESA}</strong> (nome fantasia James Olaya Designer
            Facial), inscrita no CNPJ sob o nº <strong>{CNPJ}</strong>, com sede
            em {SEDE}, que opera a marca Jay Academy e os cursos do Método James
            Olaya.
          </p>
          <p>
            Contato para assuntos de privacidade:{" "}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
        </div>

        <h2>2. Quais dados coletamos</h2>
        <h3>Dados que você nos informa</h3>
        <ul>
          <li>
            Nome, e-mail, telefone/WhatsApp e cidade, quando você preenche um
            formulário, fala com a gente pelo WhatsApp ou se inscreve em um
            conteúdo gratuito.
          </li>
          <li>
            Dados de compra, como nome, e-mail, CPF, telefone e endereço,
            informados no checkout. <strong>O pagamento é processado pela
            Hotmart.</strong> Nós não recebemos nem armazenamos os dados do seu
            cartão.
          </li>
        </ul>
        <h3>Dados coletados automaticamente</h3>
        <ul>
          <li>
            Endereço IP, tipo de navegador e dispositivo, páginas visitadas,
            tempo de permanência, origem do acesso (por exemplo, o anúncio pelo
            qual você chegou) e interações com a página.
          </li>
          <li>
            Esses dados são coletados por cookies e tecnologias semelhantes, como
            o Pixel da Meta, o Google Tag Manager e o Google Analytics (veja a
            seção 6).
          </li>
        </ul>

        <h2>3. Para que usamos os seus dados</h2>
        <ul>
          <li>Liberar o acesso ao curso comprado e prestar suporte ao aluno.</li>
          <li>Responder mensagens e dúvidas enviadas pelo site ou pelo WhatsApp.</li>
          <li>
            Enviar comunicações sobre o curso, conteúdos, novidades e ofertas.
            Você pode cancelar quando quiser.
          </li>
          <li>Medir o desempenho do site e dos nossos anúncios.</li>
          <li>
            Mostrar anúncios mais relevantes para você no Facebook, no Instagram
            e na rede do Google, e deixar de mostrar anúncios de um curso para
            quem já comprou.
          </li>
          <li>
            Cumprir obrigações legais e fiscais e nos defender em processos, se
            necessário.
          </li>
          <li>Prevenir fraudes e garantir a segurança do site.</li>
        </ul>

        <h2>4. Bases legais (LGPD)</h2>
        <p>Tratamos seus dados com base em:</p>
        <ul>
          <li>
            <strong>Execução de contrato:</strong> para entregar o curso
            comprado e dar suporte.
          </li>
          <li>
            <strong>Consentimento:</strong> para cookies de marketing e para o
            envio de comunicações, quando aplicável.
          </li>
          <li>
            <strong>Legítimo interesse:</strong> para melhorar o site, medir
            resultados e divulgar nossos cursos, sempre respeitando os seus
            direitos e expectativas.
          </li>
          <li>
            <strong>Cumprimento de obrigação legal ou regulatória:</strong> para
            emissão de nota fiscal e guarda de registros exigidos por lei.
          </li>
        </ul>

        <h2>5. Com quem compartilhamos</h2>
        <p>Não vendemos os seus dados. Compartilhamos apenas o necessário com:</p>
        <ul>
          <li>
            <strong>Hotmart:</strong> plataforma de pagamento e de entrega do
            curso.
          </li>
          <li>
            <strong>Meta (Facebook e Instagram) e Google:</strong> para medir e
            exibir anúncios. Quando usamos listas de clientes para anúncios,
            e-mails e telefones são enviados de forma criptografada (hash), e as
            plataformas usam essas informações apenas para encontrar
            correspondências.
          </li>
          <li>
            <strong>WhatsApp:</strong> quando você escolhe falar com a gente por
            lá.
          </li>
          <li>
            <strong>Fornecedores de tecnologia:</strong> hospedagem do site,
            ferramentas de e-mail e de atendimento, sempre sob obrigação de
            confidencialidade.
          </li>
          <li>
            <strong>Autoridades públicas:</strong> quando exigido por lei ou por
            ordem judicial.
          </li>
        </ul>

        <h2>6. Cookies e tecnologias de rastreamento</h2>
        <p>
          Usamos cookies para fazer o site funcionar, entender como ele é usado
          e personalizar anúncios. As principais ferramentas são:
        </p>
        <div className="tab">
          <table>
            <thead>
              <tr>
                <th>Ferramenta</th>
                <th>Empresa</th>
                <th>Para que serve</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Pixel da Meta</td>
                <td>Meta Platforms</td>
                <td>
                  Mede visitas e compras vindas dos anúncios e cria públicos para
                  anúncios no Facebook e no Instagram
                </td>
              </tr>
              <tr>
                <td>Google Tag Manager</td>
                <td>Google</td>
                <td>Gerencia as ferramentas de medição do site</td>
              </tr>
              <tr>
                <td>Google Analytics</td>
                <td>Google</td>
                <td>Estatísticas de acesso e navegação</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Você pode bloquear ou apagar cookies nas configurações do seu
          navegador. Também pode ajustar suas preferências de anúncios em:
        </p>
        <ul>
          <li>
            Meta:{" "}
            <a href="https://www.facebook.com/adpreferences" target="_blank" rel="noopener noreferrer">
              facebook.com/adpreferences
            </a>
          </li>
          <li>
            Google:{" "}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
              adssettings.google.com
            </a>
          </li>
        </ul>
        <p>
          Se você bloquear alguns cookies, partes do site podem não funcionar
          como esperado.
        </p>

        <h2>7. Transferência internacional</h2>
        <p>
          Algumas das empresas acima, como a Meta e o Google, podem armazenar
          dados em servidores fora do Brasil. Nesses casos, a transferência segue
          as hipóteses permitidas pela LGPD, com cláusulas contratuais e medidas
          de segurança adequadas.
        </p>

        <h2>8. Por quanto tempo guardamos os dados</h2>
        <p>
          Mantemos os seus dados enquanto forem necessários para as finalidades
          desta política, enquanto você tiver acesso ao curso ou pelo prazo
          exigido por lei, como os prazos fiscais e os previstos no Marco Civil
          da Internet. Depois disso, os dados são excluídos ou anonimizados.
        </p>

        <h2>9. Seus direitos</h2>
        <p>Pela LGPD, você pode, a qualquer momento:</p>
        <ul>
          <li>confirmar se tratamos os seus dados e acessá-los;</li>
          <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
          <li>
            pedir a anonimização, o bloqueio ou a eliminação de dados
            desnecessários ou tratados em desconformidade com a lei;
          </li>
          <li>pedir a portabilidade dos dados;</li>
          <li>pedir a eliminação dos dados tratados com base no seu consentimento;</li>
          <li>saber com quem compartilhamos os seus dados;</li>
          <li>revogar o seu consentimento;</li>
          <li>se opor a um tratamento que não esteja de acordo com a lei.</li>
        </ul>
        <p>
          Para exercer qualquer um desses direitos, escreva para{" "}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Responderemos em até 15 dias.
          Você também pode apresentar reclamação à Autoridade Nacional de
          Proteção de Dados (ANPD).
        </p>

        <h2>10. Segurança</h2>
        <p>
          Adotamos medidas técnicas e administrativas para proteger os seus dados
          contra acesso não autorizado, perda ou alteração. Nenhum sistema é 100%
          seguro, mas trabalhamos continuamente para reduzir riscos.
        </p>

        <h2>11. Menores de idade</h2>
        <p>
          Nossos cursos são destinados a maiores de 18 anos. Não coletamos
          intencionalmente dados de menores de idade.
        </p>

        <h2>12. Alterações nesta política</h2>
        <p>
          Podemos atualizar esta política a qualquer momento. A versão vigente
          estará sempre nesta página, com a data da última atualização no topo.
        </p>

        <h2>13. Contato</h2>
        <div className="card">
          <p>
            <strong>{EMPRESA}</strong> · CNPJ {CNPJ}
            <br />
            E-mail: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <br />
            WhatsApp:{" "}
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              {WHATSAPP}
            </a>
          </p>
        </div>
      </main>

      <footer>
        © 2026 Jay Academy · {EMPRESA} · CNPJ {CNPJ}
      </footer>
    </div>
  );
}
