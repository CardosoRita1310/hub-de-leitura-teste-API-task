/// <reference types="cypress" />
import { faker } from '@faker-js/faker';

describe('Testes da Funcionalidade Catálogo de Livros', () => {

     let tokenAdm
     let tokenUser
     beforeEach(() => {
          cy.geraToken('admin@biblioteca.com', 'admin123').then(tkn => {
               tokenAdm = tkn
          })

          cy.geraToken('usuario@teste.com', 'user123').then(tkn => {
               tokenUser = tkn
          })
     });

     // Objetivo: Verificar que a API retorna lista de livros com paginação e filtros funcionando
     // Validar que filtros por categoria e autores funcionam corretamente
     it('GET - Deve listar livros com filtros e paginação', () => {
          cy.api({
               method: 'GET',
               url: 'books',
               qs: {
                    category: 'Fantasia',
                    author: 'J.R.R. Tolkien',
                    limit: 2
               }

          }).should(response => {
               expect(response.status).to.equal(200)
               expect(response.body.books).to.be.an('array')
               expect(response.body.pagination.limit).to.equal(2)
               expect(response.body.books[0].category).to.equal('Fantasia')
               expect(response.body.books[0].author).to.equal('J.R.R. Tolkien')
               expect(response.body.pagination).to.have.property('currentPage')
               expect(response.body.pagination).to.have.property('totalPages')


          })
     });

     // Objetivo: Validar que é possível obter detalhes de um livro específico pelo ID
     // Verificar que todos os campos do livro são retornados corretamente
     it('GET - Deve obter detalhes de um livro específico', () => {
          cy.api({
               method: 'GET',
               url: 'books/5',

          }).should(response => {
               expect(response.status).to.equal(200)
               expect(response.body.book).to.have.property('id')
               expect(response.body.book).to.have.property('title')
               expect(response.body.book).to.have.property('author')
               expect(response.body.book).to.have.property('isbn')
               expect(response.body.book).to.have.property('editor')
               expect(response.body.book).to.have.property('category')
               expect(response.body.book).to.have.property('language')
               expect(response.body.book).to.have.property('publication_year')
               expect(response.body.book).to.have.property('pages')
               expect(response.body.book).to.have.property('format')
               expect(response.body.book).to.have.property('total_copies')
               expect(response.body.book).to.have.property('available_copies')
               expect(response.body.book).to.have.property('description')
               expect(response.body.book).to.have.property('cover_image')
               expect(response.body.book).to.have.property('created_at')
               expect(response.body.book).to.have.property('total_reservations')
               expect(response.body.book).to.have.property('active_reservations')
               expect(response.body.book).to.have.property('average_rating')
               expect(response.body.book).to.have.property('total_reviews')
               expect(response.body.book).to.have.property('isAvailable')
               expect(response.body.book).to.have.property('availability_status')
               expect(response.body.book).to.have.property('recent_reviews')

          })
     });

     // Objetivo: Validar que um novo livro é adicionado com sucesso ao catálogo
     // Verificar que apenas admin pode adicionar novos livros (validação de permissão)
     it('POST - Deve cadastrar um novo livro com sucesso', () => {
          let title = faker.book.title()
          cy.api({
               method: 'POST',
               url: 'books',
               headers: {
                    'Authorization': tokenAdm
               },
               body: {
                    title: title,
                    author: "Aluísio Azevedo",
                    description: "Romance naturalista que retrata a vida em um cortiço",
                    category: "Literatura Brasileira",
                    isbn: "978-85-260-1320-6",
                    editor: "Editora Ática",
                    language: "Português",
                    publication_year: 1890,
                    pages: 312,
                    format: "Físico",
                    total_copies: 4,
                    available_copies: 4
               }
          }).should(response => {
               expect(response.status).to.equal(201)
               expect(response.body.message).to.equal('Livro criado com sucesso.')
               expect(response.body.book).to.have.property('id')
               expect(response.body.book.id).to.be.a('number')

          })

     });

     it('POST - Deve rejeitar cadastro de livro por usuário sem permissão', () => {
          let title = faker.book.title()

          cy.api({
               method: 'POST',
               url: 'books',
               headers: {
                    'Authorization': tokenUser
               },
               body: {
                    title: title,
                    author: "Aluísio Azevedo",
                    category: "Literatura Brasileira",
                    total_copies: 4,
                    available_copies: 4
               },
               failOnStatusCode: false

          }).should(response => {
               expect(response.status).to.equal(403)
               expect(response.body.message).to.equal('Acesso negado. Apenas administradores podem realizar esta ação.')

          })


     });

     // Objetivo: Garantir que dados inválidos são rejeitados ao adicionar um livro
     // Validar mensagens de erro apropriadas para dados faltantes ou incorretos
     it('POST -  Deve rejeitar livro com dados inválidos', () => {
          let title = faker.book.title()
          cy.api({
               method: 'POST',
               url: 'books',
               headers: {
                    'Authorization': tokenAdm
               },
               body: {
                    title: title,
                    author: "Aluísio Azevedo",
                    category: "Literatura Brasileira",
                    total_copies: 0,
                    available_copies: 10
               },
               failOnStatusCode: false
          }).should(response => {
               expect(response.status).to.equal(400)
               expect(response.body.message).to.equal("\"total_copies\" must be greater than or equal to 1")
          })

     });

     // Objetivo: Validar que um livro pode ser atualizado com sucesso
     // Verificar que apenas admin pode atualizar livros (validação de permissão)
     it('PUT - Deve atualizar um livro previamente cadastrado', () => {
          let title = faker.book.title()

          cy.cadastrarLivro(title, tokenAdm).then(id => {
               cy.api({
                    method: 'PUT',
                    url: 'books/' + id,
                    headers: {
                         'Authorization': tokenAdm
                    },
                    body: {
                         title: title,
                         author: "Aluísio Azevedo alterado",
                         category: "Literatura Brasileira",
                         total_copies: 4,
                         available_copies: 4
                    }
               }).should(response => {
                    expect(response.status).to.equal(200)
                    expect(response.body.message).to.equal('Livro atualizado com sucesso.')

               })
          })
     });

     it('PUT - Deve rejeitar atualização de livro por usuário sem permissão', () => {
          let title = faker.book.title()

          cy.cadastrarLivro(title, tokenAdm).then(id => {
               cy.api({
                    method: 'PUT',
                    url: 'books/' + id,
                    headers: {
                         'Authorization': tokenUser
                    },
                    body: {
                         title: title,
                         author: "Aluísio Azevedo alterado",
                         category: "Literatura Brasileira",
                         total_copies: 4,
                         available_copies: 4
                    },
                    failOnStatusCode: false
               }).should(response => {
                    expect(response.status).to.equal(403)
                    expect(response.body.message).to.equal('Acesso negado. Apenas administradores podem realizar esta ação.')

               })
          })
     });

     // Objetivo: Validar que um livro pode ser removido do catálogo
     // Verificar que apenas admin pode deletar livros (validação de permissão)
     it('DELETE - Deve deletar um livro previamente cadastrado', () => {
          let title = faker.book.title()

          cy.cadastrarLivro(title, tokenAdm).then(id => {
               cy.api({
                    method: 'DELETE',
                    url: 'books/' + id,
                    headers: {
                         'Authorization': tokenAdm
                    }
               }).should(response => {
                    expect(response.status).to.equal(200)
                    expect(response.body.message).to.equal('Livro deletado com sucesso.')

               })
          })
     });

     it('DELETE - Deve rejeitar exclusão de livro por usuário sem permissão', () => {
          let title = faker.book.title()

          cy.cadastrarLivro(title, tokenAdm).then(id => {
               cy.api({
                    method: 'DELETE',
                    url: 'books/' + id,
                    headers: {
                         'Authorization': tokenUser
                    },
                    failOnStatusCode: false
               }).should(response => {
                    expect(response.status).to.equal(403)
                    expect(response.body.message).to.equal('Acesso negado. Apenas administradores podem realizar esta ação.')

               })
          })
     });
});
