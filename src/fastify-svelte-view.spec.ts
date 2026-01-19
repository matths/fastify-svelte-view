import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fastifySvelteView } from './fastify-svelte-view';
import fastifyPiscina from '@piscina/fastify';

vi.mock('@piscina/fastify', () => ({
	default: vi.fn(() => 'mockPiscina')
}));

describe('fastifySvelteView', () => {
	let fastify: any;
	let registerOptions: any;

	afterEach(() => {
		vi.clearAllMocks();
	});

	beforeEach(() => {
		fastify = {
			register: vi.fn(),
			decorate: vi.fn(),
			runTask: vi.fn().mockResolvedValue('rendered'),
		};
		registerOptions = {
			templateDir: '/templates',
			layoutTemplate: 'layout.svelte',
			generate: {},
		};
	});


	it('registers fastifyPiscina (mocked) with correct filename', async () => {
		await fastifySvelteView(fastify, registerOptions);
		expect(fastify.register).toHaveBeenCalledWith(
			fastifyPiscina,
			expect.objectContaining({
				filename: expect.stringContaining('svelte-bundler.js'),
			})
		);
	});

	it('decorates fastify with renderSvelte', async () => {
		await fastifySvelteView(fastify, registerOptions);
		expect(fastify.decorate).toHaveBeenCalledWith(
			'renderSvelte',
			expect.any(Function)
		);
	});

	it('renderSvelte calls runTask with merged options', async () => {
		await fastifySvelteView(fastify, registerOptions);
		const renderSvelte = fastify.decorate.mock.calls[0][1];
		const renderOptions = { foo: 'bar' };
		await renderSvelte(renderOptions);
		expect(fastify.runTask).toHaveBeenCalledWith({
			templateDir: '/templates',
			layoutTemplate: 'layout.svelte',
			foo: 'bar',
		});
	});
});
