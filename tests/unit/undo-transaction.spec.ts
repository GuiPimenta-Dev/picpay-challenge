import { InMemoryTransactionsRepository } from "../../src/infra/repositories/in-memory/transactions";
import { InMemoryUsersRepository } from "../../src/infra/repositories/in-memory/users";
import { TransactionBuilder } from "../utils/builder/transaction";
import { UndoTransaction } from "../../src/usecases/undo-transaction";
import { UserBuilder } from "../utils/builder/user";

test("It should be able to undo a deposit transaction", async () => {
  const usersRepository = new InMemoryUsersRepository();
  const user = UserBuilder.anUser().build();
  await usersRepository.create(user);
  const transactionsRepository = new InMemoryTransactionsRepository();
  const deposit = TransactionBuilder.aDeposit().of(100).to(user.id).build();
  await transactionsRepository.create(deposit);

  const sut = new UndoTransaction({ transactionsRepository });
  const input = { transactionId: deposit.id };
  await sut.execute(input);

  const balance = await transactionsRepository.calculateBalance(user.id);
  expect(balance).toBe(0);
});

test("It should be able to undo a transfer transaction", async () => {
  const usersRepository = new InMemoryUsersRepository();
  const payer = UserBuilder.anUser().build();
  const payee = UserBuilder.anUser().build();
  await usersRepository.create(payer);
  await usersRepository.create(payee);
  const transactionsRepository = new InMemoryTransactionsRepository();
  const deposit = TransactionBuilder.aDeposit().of(100).to(payer.id).build();
  const transfer = TransactionBuilder.aTransfer().of(100).from(payer.id).to(payee.id).build();
  await transactionsRepository.create(deposit);
  await transactionsRepository.create(transfer);

  const sut = new UndoTransaction({ transactionsRepository });
  const input = { transactionId: transfer.id };
  await sut.execute(input);

  const payerBalance = await transactionsRepository.calculateBalance(payer.id);
  const payeeBalance = await transactionsRepository.calculateBalance(payee.id);
  expect(payerBalance).toBe(100);
  expect(payeeBalance).toBe(0);
});
