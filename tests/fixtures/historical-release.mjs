// Exact historical fixture bytes are pinned once for source and installed replay.
// The alpha.3 evidence bundle SHA-256 is c2f13768c3f6e134bb4b24765a2a3dfadd7aa8eb7bf3ca103bbf444b0371a557.
// Its release manifest names a signed tag target; the asset is not independently signed.
export const declarativeV1Files = Object.freeze({
  'provider.json': '7229f5541d16aca5f9b565e5fc5721a318df320eec48588d36b8d07473ede46d',
  'source/manifest.json': '726db625c57b644bd1fa848ed7e96e17760b7f37df389ba093f091f5328a6767',
  'source/semantic.json': '70844a60a44f9c9ffea5fea9b251ce7c4e768dfed4bec9f08df80c0ad50b31e4',
  'source/contract.md': '6745a600e15251de2d55276894a0afd83edd7fee2b4d8ca3cd0f426edbf290ad',
  'edition.json': '68fa90b017ec6a7b7d62866c472fee36b24f54b59e696cfcbdbc5ee113da4efe',
});

export const alpha3ReleaseFiles = Object.freeze({
  'source-manifest.json': 'fe0be1b158cf4321187f7852f41f4eb0d5e63cee19e899e16953f72be78393f5',
  'claim-model.json': '03eec4edc92eadc00d36e4dc3000bd2665dda05d46ebe3a8ab33b1fa37c47024',
  'edition.json': '84743256523ecbc8a7da9daff17b6f22cae028d71afdd5a21d61d729516cfd37',
  'candidate.json': '58d17e21c77ae1375b707e7016defedf3fdf3112958498543ce60c66e9b6d699',
  'qualification.json': '4f763eb3409f7b62e74b5ca11f7b8acdf1120412a7dccf26e0d1ba9f3a250d97',
});

export const alpha3CandidateDigest =
  'b051df1d3b424198998cedd43a7f467d9ce93ceda3d00717d97b3699ae534e60';
export const alpha3QualificationDigest =
  'b24ee992d039a4b8476a450a279ec303a09e4177c50129cb04b7f6da916307a7';
